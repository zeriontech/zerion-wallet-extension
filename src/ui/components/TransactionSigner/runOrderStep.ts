import { ethers } from 'ethers';
import { HTTPError } from 'ky';
import type { IntentMultichain } from 'src/shared/types/Quote';
import { isIntentQuote } from 'src/shared/types/Quote';
import type { OrderPlacedReport } from 'src/shared/types/OrderPlaced';
import type { ExecuteOrderPayload } from 'src/modules/zerion-api/requests/transaction-execute-order';
import { invariant } from 'src/shared/invariant';
import { prepareTypedDataForSigning } from 'src/modules/ethereum/message-signing/prepareTypedDataForSigning';
import {
  prepareTypedData,
  removeUnusedTypes,
} from 'src/modules/ethereum/message-signing/prepareTypedData';
import { findIntentTypedDataProblems } from 'src/ui/shared/forms/trading/intentTypedData';
import {
  IntentSignerMismatchError,
  IntentVerificationError,
  OrderPlacementError,
  QuoteExpiredError,
} from './errors';
import type { OrderStepParams, OrderStepResult, QueueEvent } from './types';

export type ExecuteOrderFailure = { status: number | null; body: string };

export interface RunOrderStepDeps {
  signIntent: (intent: IntentMultichain) => Promise<string>;
  executeOrder: (payload: ExecuteOrderPayload) => Promise<{ orderId: string }>;
  reportOrderPlaced: (report: OrderPlacedReport) => Promise<unknown>;
  reportExecuteOrderFailure: (failure: ExecuteOrderFailure) => void;
  emit: (event: QueueEvent) => void;
  address: string;
  nowSeconds: () => number;
  signal: AbortSignal;
}

function throwIfAborted(signal: AbortSignal) {
  if (signal.aborted) {
    throw new DOMException('Order step aborted', 'AbortError');
  }
}

function validateIntentDocuments(
  { quote, expected }: OrderStepParams,
  nowSeconds: number
) {
  const documents = [quote.intentApprove?.evm, quote.intentSwap?.evm].filter(
    (document) => document != null
  );
  if (documents.length === 0) {
    return;
  }
  if (!expected) {
    throw new IntentVerificationError([
      'No expected signing parameters to validate the typed data against',
    ]);
  }
  const expectedNow = { ...expected, nowSeconds };
  const problems = documents.flatMap((document) =>
    findIntentTypedDataProblems(document, expectedNow)
  );
  if (problems.length === 0) {
    return;
  }
  if (problems.every((problem) => problem.expired)) {
    throw new QuoteExpiredError();
  }
  throw new IntentVerificationError(problems.map((problem) => problem.message));
}

function recoverTypedDataSigner(
  document: NonNullable<IntentMultichain['evm']>,
  signature: string
): string | null {
  try {
    const typedData = prepareTypedData(prepareTypedDataForSigning(document));
    return ethers.verifyTypedData(
      typedData.domain,
      removeUnusedTypes(typedData.types, typedData.primaryType),
      typedData.message,
      signature
    );
  } catch {
    return null;
  }
}

async function signIntentAsWallet(
  intent: IntentMultichain,
  deps: RunOrderStepDeps
): Promise<string> {
  const signature = await deps.signIntent(intent);
  if (intent.evm) {
    const signer = recoverTypedDataSigner(intent.evm, signature);
    if (signer?.toLowerCase() !== deps.address.toLowerCase()) {
      throw new IntentSignerMismatchError(deps.address, signer);
    }
  }
  return signature;
}

async function readExecuteOrderFailure(
  error: unknown
): Promise<ExecuteOrderFailure> {
  if (error instanceof HTTPError) {
    const body = await error.response.text().catch(() => '');
    return { status: error.response.status, body };
  }
  return {
    status: null,
    body: error instanceof Error ? `${error.name}: ${error.message}` : '',
  };
}

async function placeOrder(
  payload: ExecuteOrderPayload,
  deps: RunOrderStepDeps
): Promise<string> {
  try {
    const { orderId } = await deps.executeOrder(payload);
    invariant(orderId, 'execute-order returned no orderId');
    return orderId;
  } catch (error) {
    const failure = await readExecuteOrderFailure(error);
    deps.reportExecuteOrderFailure(failure);
    if (failure.status === 400) {
      throw new QuoteExpiredError();
    }
    throw new OrderPlacementError(failure.status);
  }
}

/**
 * Executes the accepted intent quote as is (no re-quote, WLT-2936): validate
 * every typed-data document, sign the permit then the intent, check each
 * signature recovers to the wallet, place the Order once, and resolve without
 * waiting for settlement.
 */
export async function runOrderStep({
  params,
  index,
  deps,
}: {
  params: OrderStepParams;
  index: number;
  deps: RunOrderStepDeps;
}): Promise<OrderStepResult> {
  const { expected: _expected, ...context } = params;
  const { quote } = params;
  invariant(isIntentQuote(quote), 'Order step requires an intent quote');

  validateIntentDocuments(params, deps.nowSeconds());

  deps.emit({ type: 'step-signing', index });
  const signatureApprove = quote.intentApprove?.evm
    ? await signIntentAsWallet(quote.intentApprove, deps)
    : undefined;
  throwIfAborted(deps.signal);
  const signatureSwap = await signIntentAsWallet(quote.intentSwap, deps);
  throwIfAborted(deps.signal);

  const orderId = await placeOrder(
    {
      quoteId: quote.quoteId,
      signatureSwap,
      ...(signatureApprove ? { signatureApprove } : {}),
    },
    deps
  );

  deps
    .reportOrderPlaced({
      orderId,
      quoteId: quote.quoteId,
      address: deps.address,
      context,
    })
    .catch((error) => {
      // eslint-disable-next-line no-console
      console.error('runOrderStep: uiReportOrderPlaced failed', error);
    });
  deps.emit({ type: 'step-order-placed', index, orderId });
  return { order: { orderId } };
}

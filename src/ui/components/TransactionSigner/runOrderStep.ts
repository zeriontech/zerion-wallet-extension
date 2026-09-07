import type {
  IntentApprovePayload,
  IntentSwapPayload,
  Quote2,
} from 'src/shared/types/Quote';
import type { AnyAddressAction } from 'src/modules/ethereum/transactions/addressAction';
import type { TransactionContextParams } from 'src/shared/types/SignatureContextParams';
import type { OrderWaitResult } from 'src/ui/transactions/useLocalTransactionStatus';
import { invariant } from 'src/shared/invariant';
import { OrderFailedError } from './errors';
import type {
  OrderStepParams,
  OrderStepResult,
  OrderTarget,
  QueueEvent,
  RequoteParams,
} from './types';

/** How long the queue waits for settlement before "Still processing" */
export const ORDER_WAIT_MS = 5 * 60 * 1000;

export type SubmitOrderParams = {
  quoteId: string;
  signatureSwap: string;
  signatureApprove?: string;
  orderContext: TransactionContextParams & {
    quote: Quote2;
    outputChain: string | null;
  };
  order: OrderTarget;
};

export interface RunOrderStepDeps {
  requote: (params: RequoteParams) => Promise<Quote2>;
  /** Software: walletPort `signSwapIntent`; hardware: the Ledger iframe */
  signIntent: (
    intent: IntentSwapPayload | IntentApprovePayload
  ) => Promise<string>;
  submitOrder: (params: SubmitOrderParams) => Promise<{ orderId: string }>;
  waitForOrder: (
    orderId: string,
    timeoutMs: number
  ) => Promise<OrderWaitResult>;
  emit: (event: QueueEvent) => void;
  orderWaitMs?: number;
}

/**
 * The pending address action was built from the quote the user accepted; a
 * Re-quote changes the expected output, so the single incoming transfer is
 * updated to the fresh amount.
 */
export function withFreshOutputAmount(
  addressAction: AnyAddressAction | null,
  quote: Quote2
): AnyAddressAction | null {
  if (!addressAction?.content?.transfers) return addressAction;
  const incoming = addressAction.content.transfers.filter(
    (t) => t.direction === 'in'
  );
  if (incoming.length !== 1) return addressAction;
  const transfers = addressAction.content.transfers.map((t) =>
    t.direction === 'in' ? { ...t, amount: quote.outputAmount } : t
  );
  return {
    ...addressAction,
    content: { ...addressAction.content, transfers },
  } as AnyAddressAction;
}

/**
 * Pure orchestration of an Intent Swap step (PRD §4.3). Side effects are
 * injected so the sequence is unit-testable.
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
  const {
    requote,
    order,
    quote: initialQuote,
    outputChain,
    ...context
  } = params;
  let quote = initialQuote;
  let addressAction = context.addressAction;

  if (requote) {
    deps.emit({ type: 'step-requoting', index });
    quote = await deps.requote(requote);
    addressAction = withFreshOutputAmount(addressAction, quote);
  }

  deps.emit({ type: 'step-signing', index });
  invariant(quote.intentSwap, 'Order step requires an Intent Swap quote');
  invariant(quote.quoteId, 'Order step requires a quoteId');
  const signatureApprove = quote.intentApprove?.evm
    ? await deps.signIntent(quote.intentApprove)
    : undefined;
  const signatureSwap = await deps.signIntent(quote.intentSwap);

  const { orderId } = await deps.submitOrder({
    quoteId: quote.quoteId,
    signatureSwap,
    ...(signatureApprove ? { signatureApprove } : {}),
    orderContext: { ...context, addressAction, quote, outputChain },
    order,
  });
  deps.emit({ type: 'step-order-pending', index, orderId });

  const status = await deps.waitForOrder(
    orderId,
    deps.orderWaitMs ?? ORDER_WAIT_MS
  );
  if (status === 'failed') {
    throw new OrderFailedError(orderId, 'failed');
  }
  if (status === 'timeout') {
    deps.emit({ type: 'step-still-processing', index, orderId });
    return { order: { orderId, status: 'timeout' } };
  }
  return { order: { orderId, status: 'confirmed' } };
}

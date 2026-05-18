import type { TypedData } from 'src/modules/ethereum/message-signing/TypedData';
import type {
  ExchangeAction,
  ExchangeRequestBody,
  L1Action,
  UserSignedAction,
} from '../actions/types';
import { buildL1ActionTypedData } from '../signature/buildL1ActionTypedData';
import { buildUserSignedActionTypedData } from '../signature/buildUserSignedActionTypedData';
import { parseSignatureHex } from '../signature/parseSignature';
import type { ExchangeResponse } from '../api/submitExchangeAction.types';

const L1_ACTION_TYPES = new Set(['order', 'updateLeverage', 'setReferrer']);

export function isL1Action(action: ExchangeAction): action is L1Action {
  return L1_ACTION_TYPES.has(action.type);
}

/**
 * The nonce for an action submission. For L1 actions this is a fresh ms-since-epoch.
 * For UserSignedAction subtypes that carry their own nonce field (approveBuilderFee,
 * userSetAbstraction, withdraw3), the caller MUST pass the same value the action
 * was built with — otherwise the typed-data hash and the /exchange envelope diverge
 * and the server rejects.
 */
export interface SignAndSubmitInput {
  action: ExchangeAction;
  nonce: number;
  expiresAfter?: number;
  vaultAddress?: string;
}

export interface SignAndSubmitDeps {
  signTypedData: (typedData: TypedData) => Promise<string>;
  submit?: (body: ExchangeRequestBody) => Promise<ExchangeResponse>;
}

export class HyperliquidExchangeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HyperliquidExchangeError';
  }
}

export async function signAndSubmit(
  input: SignAndSubmitInput,
  deps: SignAndSubmitDeps
): Promise<ExchangeResponse> {
  const typedData = isL1Action(input.action)
    ? await buildL1ActionTypedData({
        action: input.action,
        nonce: input.nonce,
        expiresAfter: input.expiresAfter,
      })
    : buildUserSignedActionTypedData(input.action as UserSignedAction);

  const signatureHex = await deps.signTypedData(typedData);
  const signature = parseSignatureHex(signatureHex);

  const body: ExchangeRequestBody = {
    action: input.action,
    nonce: input.nonce,
    signature,
    ...(input.vaultAddress ? { vaultAddress: input.vaultAddress } : {}),
    ...(input.expiresAfter ? { expiresAfter: input.expiresAfter } : {}),
  };

  // Lazy-load the real submitter so test files that only need types don't
  // transitively pull in `ky` (ESM-only — chokes ts-jest's CJS pipeline).
  const submitFn =
    deps.submit ??
    (await import('../api/submitExchangeAction')).submitExchangeAction;
  const response = await submitFn(body);
  if (response.status === 'err') {
    throw new HyperliquidExchangeError(response.response);
  }
  return response;
}

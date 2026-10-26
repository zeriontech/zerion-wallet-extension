import type { ClientOptions } from '../shared';
import { CLIENT_DEFAULTS, ZerionHttpClient } from '../shared';
import type { ZerionApiContext } from '../zerion-api-bare';

export interface DismissActionProof {
  address: string;
  /** @description Unix seconds */
  expireAt: number;
  /** @description 0x-hex for EVM, base58 for Solana */
  signature: string;
}

export interface Params {
  actionId: string;
  proof: DismissActionProof;
}

export function transactionDismissAction(
  this: ZerionApiContext,
  params: Params,
  options: ClientOptions = CLIENT_DEFAULTS
) {
  const endpoint = 'transaction/dismiss-action/v1';
  const kyOptions = this.getKyOptions();
  const { address, expireAt, signature } = params.proof;
  const body: Params = {
    actionId: params.actionId,
    proof: { address, expireAt, signature },
  };
  return ZerionHttpClient.post<unknown>(
    { endpoint, body: JSON.stringify(body), ...options },
    { ...kyOptions, retry: 0 }
  );
}

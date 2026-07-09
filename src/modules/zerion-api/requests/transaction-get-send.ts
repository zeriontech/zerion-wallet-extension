import type { TransactionMultichainBackend } from 'src/shared/types/Quote';
import type { ClientOptions } from '../shared';
import { CLIENT_DEFAULTS, ZerionHttpClient } from '../shared';
import type { ZerionApiContext } from '../zerion-api-bare';
import type { Amount } from '../types/Amount';
import type { NetworkFeeType } from '../types/NetworkFeeType';
import type { TransactionPrepareError } from '../types/TransactionPrepareError';

export interface Params {
  /** @description Currency name for price conversions */
  currency: string;
  /** @description Source blockchain */
  chain: string;
  /** @description Sender address */
  from: string;
  /** @description Recipient address */
  to: string;
  /** @description ID of the asset to send (may be fungible or NFT) */
  assetId: string;
  /** @description Amount to send (mutually exclusive with max) */
  amount?: string;
  /** @description Send maximum available amount */
  max?: boolean;
  /** @description Optional arbitrary data attached to the transfer. A valid hex
   * string (with or without `0x`) is used as raw bytes; otherwise the string is
   * UTF-8 encoded. Lets users attach a message or calldata to a transfer. */
  data?: string;
}

export interface Response {
  data: {
    inputAmount: Amount;
    /** @description Error information if the send cannot proceed.
     *     If transactionSend prop is null, this object must be defined.
     */
    error: null | TransactionPrepareError;
    /** @description Network fee information */
    networkFee: null | NetworkFeeType;
    /** @description Send transaction */
    transactionSend: null | TransactionMultichainBackend;
  };
  meta: null;
  errors: null;
}

export async function transactionGetSend(
  this: ZerionApiContext,
  params: Params,
  options: ClientOptions = CLIENT_DEFAULTS
) {
  const provider = await this.getAddressProviderHeader(params.from);
  const kyOptions = this.getKyOptions();
  const searchParams = new URLSearchParams();
  searchParams.set('currency', params.currency);
  searchParams.set('chain', params.chain);
  searchParams.set('from', params.from);
  searchParams.set('to', params.to);
  searchParams.set('assetId', params.assetId);
  if (params.max) {
    searchParams.set('max', 'true');
  } else if (params.amount != null) {
    searchParams.set('amount', params.amount);
  }
  if (params.data != null) {
    searchParams.set('data', params.data);
  }
  const endpoint = `transaction/get-send/v1?${searchParams}`;
  return ZerionHttpClient.get<Response>(
    {
      endpoint,
      headers: { 'Zerion-Wallet-Provider': provider },
      ...options,
    },
    kyOptions
  );
}

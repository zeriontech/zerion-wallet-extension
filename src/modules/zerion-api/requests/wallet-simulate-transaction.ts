import type { TransactionEVM } from 'src/shared/types/Quote';
import type { SolTxSerializable } from 'src/modules/solana/SolTransaction';
import type { ClientOptions } from '../shared';
import { CLIENT_DEFAULTS, ZerionHttpClient } from '../shared';
import type { ZerionApiContext } from '../zerion-api-bare';
import type { AddressAction } from './wallet-get-actions';

interface Payload {
  /**
   * @description Currency name for price conversions // [!code link {"token":"Currency","href":"/docs/actions/entities.html#currency"}]
   * @example usd
   */
  currency: string;
  /** @description Wallet address */
  address: string;
  /** @description Domain context */
  domain: string;
  /** @description Blockchain network identifier */
  chain: string;
  transaction: {
    evm?: TransactionEVM;
    solana?: SolTxSerializable;
  };
}

export type WarningSeverity = 'Red' | 'Orange' | 'Yellow' | 'Gray';

export type Warning = {
  /** @description Warning severity level */
  severity: WarningSeverity;
  /** @description Warning title */
  title: string;
  /** @description Warning description */
  description: string;
  /** @description Additional warning details */
  details: string;
};

type Response = {
  data: { action: AddressAction; warnings: Warning[] };
  errors?: { title: string; detail: string }[];
};

export type InterpretResponse = Response;

export async function walletSimulateTransaction(
  this: ZerionApiContext,
  params: Payload,
  options: ClientOptions = CLIENT_DEFAULTS
) {
  const provider = await this.getAddressProviderHeader(params.address);
  const kyOptions = this.getKyOptions();
  const endpoint = 'wallet/simulate-transaction/v1';
  return ZerionHttpClient.post<Response>(
    {
      endpoint,
      body: JSON.stringify(params),
      headers: { 'Zerion-Wallet-Provider': provider },
      ...options,
    },
    kyOptions
  );
}

import type { TypedData } from 'src/modules/ethereum/message-signing/TypedData';
import type { ClientOptions } from '../shared';
import { CLIENT_DEFAULTS, ZerionHttpClient } from '../shared';
import type { ZerionApiContext } from '../zerion-api-bare';
import type { AddressAction } from './wallet-get-actions';
import type { Warning } from './wallet-simulate-transaction';

type Signature = {
  /** @description Optional message string */
  message?: string;
  typedData?: TypedData;
};

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
  signature: Signature;
}

type Input = {
  /** @description List of sections containing structured input data */
  sections?: Array<{
    /** @description Optional section name */
    name?: string;
    /** @description List of blocks within this section */
    blocks: Array<{
      /** @description Block name/label */
      name: string;
      /** @description The value that should be copied and shown */
      value: string;
    }>;
  }>;
};

export type InterpretInput = Input;

type Response = {
  data: { action: AddressAction; inputs: Input[]; warnings: Warning[] };
  errors?: { title: string; detail: string }[];
};

export type SignatureInterpretResponse = Response;

export async function walletSimulateSignature(
  this: ZerionApiContext,
  params: Payload,
  options: ClientOptions = CLIENT_DEFAULTS
) {
  const provider = await this.getAddressProviderHeader(params.address);
  const kyOptions = this.getKyOptions();
  const endpoint = 'wallet/simulate-signature/v1';
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

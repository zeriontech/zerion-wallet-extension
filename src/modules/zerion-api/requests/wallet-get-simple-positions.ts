import type { ClientOptions } from '../shared';
import { CLIENT_DEFAULTS, ZerionHttpClient } from '../shared';
import type { ZerionApiContext } from '../zerion-api-bare';
import type { Fungible } from '../types/Fungible';

export interface Params {
  address: string;
  currency: string;
}

type Amount = {
  currency: string;
  /** @description Amount in common units (like token units) */
  quantity: string;
  /** @description Amount in fiat units */
  value: number | null;
  /** @description Amount in USD */
  usdValue: number | null;
};

type Chain = {
  id: string;
  /**
   * @description Name of the chain
   * @example Ethereum
   */
  name: string;
  /**
   * @description URL to the chain's icon
   * @example https://example.com/icon.png
   */
  iconUrl: string;
};

export type FungiblePosition = {
  /**
   * @description Unique identifier for the position
   * @example eth-ethereum-asset
   */
  id: string;
  amount: Amount;
  fungible: Fungible;
  chain: Chain;
};

interface Response {
  data: FungiblePosition[];
  meta: null;
  errors: null;
}

export async function walletGetSimplePositions(
  this: ZerionApiContext,
  { address, currency }: Params,
  options: ClientOptions = CLIENT_DEFAULTS
) {
  const provider = await this.getAddressProviderHeader(address);
  const kyOptions = this.getKyOptions();
  const params = new URLSearchParams({ address, currency });
  const endpoint = `wallet/get-simple-positions/v1?${params}`;
  return ZerionHttpClient.get<Response>(
    {
      endpoint,
      headers: { 'Zerion-Wallet-Provider': provider },
      ...options,
    },
    kyOptions
  );
}

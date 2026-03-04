import { invariant } from 'src/shared/invariant';
import type { ClientOptions } from '../shared';
import { CLIENT_DEFAULTS, ZerionHttpClient } from '../shared';
import type { ZerionApiContext } from '../zerion-api-bare';
import type { ResponseBody } from './ResponseBody';

export interface Params {
  /** Wallet addresses */
  addresses: string[];
  /** Currency name */
  currency: string;
  /** Chain IDs */
  chainIds?: string[];
  /** Fungible asset IDs */
  fungibleIds?: string[];
}

export type WalletPnL = {
  /**
   * @description Realized gain
   * @example 3000
   */
  realizedPnl: number;
  /**
   * @description Unrealized gain
   * @example 3000
   */
  unrealizedPnl: number;
  /**
   * @description Sum of realized and unrealized gains
   * @example 3000
   */
  totalPnl: number;
  /**
   * @description Realized gain / acquisition cost of the already sold assets, 100% = 1
   * @example 0.15
   */
  relativeRealizedPnl: number;
  /**
   * @description Unrealized gain / acquisition cost of the unsold assets, 100% = 1
   * @example 0.15
   */
  relativeUnrealizedPnl: number;
  /**
   * @description Sum of realized and unrealized gains / acquisition cost of both sold and unsold assets, 100% = 1
   * @example 0.15
   */
  relativeTotalPnl: number;
} | null;

type Response = ResponseBody<WalletPnL>;

export async function walletGetPnl(
  this: ZerionApiContext,
  params: Params,
  options: ClientOptions = CLIENT_DEFAULTS
) {
  invariant(params.addresses.length > 0, 'Addresses param is empty');
  const firstAddress = params.addresses[0];
  const provider = await this.getAddressProviderHeader(firstAddress);
  const kyOptions = this.getKyOptions();
  return ZerionHttpClient.post<Response>(
    {
      endpoint: 'wallet/get-pnl/v1',
      body: JSON.stringify(params),
      headers: { 'Zerion-Wallet-Provider': provider },
      ...options,
    },
    kyOptions
  );
}

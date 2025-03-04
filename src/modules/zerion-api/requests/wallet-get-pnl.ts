import type { ClientOptions } from '../shared';
import { CLIENT_DEFAULTS, ZerionHttpClient } from '../shared';
import type { ZerionApiContext } from '../zerion-api-bare';
import type { ResponseBody } from './ResponseBody';

export interface Params {
  addresses: string[];
  currency: string;
  chainIds?: string[];
  fungibleIds?: string[];
}

export interface WalletPnL {
  bought: number;
  boughtExternal: number;
  boughtForNfts: number;
  fee: number;
  netInvested: number;
  realizedGain: number;
  sold: number;
  soldExternal: number;
  soldForNfts: number;
  unrealizedGain: number;
}

type Response = ResponseBody<WalletPnL>;

export async function walletGetPnL(
  this: ZerionApiContext,
  params: Params,
  options: ClientOptions = CLIENT_DEFAULTS
) {
  const firstAddress = params.addresses[0];
  const provider = await this.getAddressProviderHeader(firstAddress);
  const endpoint = 'wallet/get-pnl/v1';
  return ZerionHttpClient.post<Response>({
    endpoint,
    body: JSON.stringify(params),
    headers: { 'Zerion-Wallet-Provider': provider },
    ...options,
  });
}

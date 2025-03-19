import type { ClientOptions } from '../shared';
import { CLIENT_DEFAULTS, ZerionHttpClient } from '../shared';
import type { ZerionApiContext } from '../zerion-api-bare';
import type { ResponseBody } from './ResponseBody';

export interface Params {
  fungibleId: string;
  addresses: string[];
  currency: string;
}

export interface AssetAddressPnl {
  realizedPnl: number;
  unrealizedPnl: number;
  totalPnl: number;
  relativeRealizedPnl: number;
  relativeUnrealizedPnl: number;
  relativeTotalPnl: number;
  averageBuyPrice: number;
  bought: number;
}

type Response = ResponseBody<AssetAddressPnl>;

export async function assetGetFungiblePnl(
  this: ZerionApiContext,
  params: Params,
  options: ClientOptions = CLIENT_DEFAULTS
) {
  const firstAddress = params.addresses[0];
  const provider = await this.getAddressProviderHeader(firstAddress);
  return ZerionHttpClient.post<Response>({
    endpoint: 'asset/get-fungible-pnl/v1',
    body: JSON.stringify(params),
    headers: { 'Zerion-Wallet-Provider': provider },
    ...options,
  });
}

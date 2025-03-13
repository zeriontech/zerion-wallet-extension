import type { ClientOptions } from '../shared';
import { CLIENT_DEFAULTS, ZerionHttpClient } from '../shared';
import type { ZerionApiContext } from '../zerion-api-bare';
import type { ResponseBody } from './ResponseBody';

export interface Params {
  fungibleId: string;
  currency: string;
}

export interface Asset {
  id: string;
  iconUrl: string | null;
  name: string;
  new: boolean;
  symbol: string;
  verified: boolean;
  implementations: Record<string, { address: string | null; decimals: number }>;
  meta: {
    circulatingSupply: number | null;
    fullyDilutedValuation: number | null;
    marketCap: number | null;
    price: number | null;
    relativeChange1d: number | null;
    relativeChange30d: number | null;
    relativeChange90d: number | null;
    relativeChange365d: number | null;
    totalSupply: number | null;
  };
}

export interface AssetResource {
  name: string;
  url: string;
  iconUrl: string;
  displayableName: string;
}

export interface AssetFullInfo {
  extra: {
    createdAt: string;
    description: string | null;
    holders: null;
    liquidity: null;
    top10: null;
    volume24h: null;
    relevantResources: AssetResource[];
    mainChain: string;
  };
  fungible: Asset;
}

type Response = ResponseBody<AssetFullInfo>;

export async function assetGetFungibleFullInfo(
  this: ZerionApiContext,
  payload: Params,
  options: ClientOptions = CLIENT_DEFAULTS
) {
  const params = new URLSearchParams({
    fungibleId: payload.fungibleId,
    currency: payload.currency,
  });
  return ZerionHttpClient.get<Response>({
    endpoint: `asset/get-fungible-full-info/v1?${params}`,
    ...options,
  });
}

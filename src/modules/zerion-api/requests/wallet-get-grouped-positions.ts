import type { AddressPosition } from 'defi-sdk';
import type { Chain } from 'src/modules/networks/Chain';
import { ZerionHttpClient } from '../shared';
import type { ZerionApiContext } from '../zerion-api-bare';
import type { ClientOptions } from '../shared';
import type { ResponseBody } from './ResponseBody';

interface AssetImplementation {
  address: string | null; // Address of the asset implementation, nullable
  decimals: number; // Decimals for the asset implementation
}

interface Price {
  value: number; // Current value of the asset
  relativeChange24h: number | null; // Nullable relative change in the price over the last 24 hours
  changedAt: number; // Timestamp of the last price change or lack of information (-1)
}

interface Asset {
  id: string;
  name: string; // Name of the asset, e.g., "Bancor Network Token"
  symbol: string; // Symbol of the asset, e.g., "BNT"
  implementations: {
    [chain: string]: AssetImplementation; // Implementations on different chains
  };
  iconUrl: string | null; // URL to the asset's icon, nullable
  price: Price | null; // Nullable Price object
  isDisplayable: boolean; // Indicates if the asset is displayable
  isVerified: boolean; // Indicates if the asset is verified
}

type App = {
  id: string;
  name: string;
  iconUrl: null | string; // null for wallet group
  url: null | string; // for the manage button, null for wallet group
};

type ChainDescription = {
  id: string;
  name: string;
  iconUrl: string | null;
  testnet: boolean;
};

export interface GroupedFungiblePosition {
  id: string;
  asset: Asset;
  /** TODO: @deprecate, use "aggregatedQuantity" instead */
  quantity: string;
  // if it is for ByPositionResponse, it is always of "asset" type
  type: AddressPosition['type']; // asset, deposit, loan, staked, etc
  chains: ChainDescription[]; // more than one array item implies aggregated asset position
  value: number;
  isDisplayable: boolean;
  updatedAt: string;
  updatedAtBlock: number;
  // for aggregated asset, return average of price percentage change of the same assets
  // for non-aggregated asset, return price percentage change
  relativeChange24h: number;
  // for aggregated asset, return sum of absolute value change of the same assets
  // for non-aggregated asset, return absolute value change (relative change * value)
  absoluteChange24h: number;
}

export interface AppPortfolio {
  app: App;
  percentageAllocation: number;
  value: number;
  groups: [
    {
      // for wallet, there is only one group without name (null)
      // for dapp protocols, there is a group name (e.g. Aave V3 Lending)
      name: null | string;
      fungiblePositions: GroupedFungiblePosition[];
    }
  ];
}

export type ByAppResponse = ResponseBody<{ apps: AppPortfolio[] }>;
export type ByPositionResponse = ResponseBody<{
  positions: GroupedFungiblePosition[];
}>;

interface WalletGetGroupedPositionsParams {
  addresses: string[];
  currency: string;
  chainIds?: Chain[];
  assetIds?: string[];
  groupBy: 'by-app' | 'by-position';
}

export async function walletGetGroupedPositions<
  T extends WalletGetGroupedPositionsParams
>(this: ZerionApiContext, params: T, options: ClientOptions) {
  const firstAddress = params.addresses[0];
  const provider = await this.getAddressProviderHeader(firstAddress);
  const endpoint = 'wallet/get-grouped-positions/v1?backend_env=staging';
  type ReturnType = T['groupBy'] extends 'by-app'
    ? ByAppResponse
    : ByPositionResponse;
  return await ZerionHttpClient.post<ReturnType>({
    endpoint,
    body: JSON.stringify(params),
    headers: { 'Zerion-Wallet-Provider': provider },
    ...options,
  });
}

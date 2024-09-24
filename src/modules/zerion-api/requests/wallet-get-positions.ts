import type {
  AddressPosition as DefiSdkAddressPosition,
  Asset as DefiSdkAsset,
  AddressPositionDappInfo as DefiSdkAddressPositionDappInfo,
  PositionType,
} from 'defi-sdk';
import type { Chain } from 'src/modules/networks/Chain';
import type { ClientOptions } from '../shared';
import { ZerionHttpClient } from '../shared';
import type { ResponseBody } from './ResponseBody';
import { getAddressProviderHeader } from './shared';

interface Price {
  value: number;
  relativeChange24h: number;
  changedAt: number;
}

interface Asset {
  id: string;
  iconUrl: string | null;
  name: string;
  price: Price | null;
  symbol: string;
  isDisplayable: boolean;
  isVerified: boolean;
  implementations?: {
    [key: string]: {
      address: string | null;
      decimals: number;
    };
  };
}

interface AddressPositionDappInfo {
  id: string;
  name: string | null;
  url: string | null;
  iconUrl: string | null;
}

export interface WalletPosition {
  apy: string | null;
  asset: Asset;
  chain: {
    id: string;
    name: string;
    testnet: boolean;
    iconUrl: string;
  };
  id: string;
  includedInChart: boolean;
  name: string;
  parentId: string | null;
  protocol: string | null;
  quantity: string | null;
  type: PositionType;
  value: string | null;
  isDisplayable: boolean;
  dapp: AddressPositionDappInfo | null;
}

export interface Params {
  addresses: string[];
  currency: string;
  chainIds?: Chain[];
  assetIds?: string[];
}

type WalletGetPositionsResponse = ResponseBody<WalletPosition[]>;

export async function walletGetPositions(
  params: Params,
  options: ClientOptions
) {
  const firstAddress = params.addresses[0];
  const provider = await getAddressProviderHeader(firstAddress);
  const endpoint = 'wallet/get-positions/v1';
  return ZerionHttpClient.post<WalletGetPositionsResponse>({
    endpoint,
    body: JSON.stringify(params),
    headers: { 'Zerion-Wallet-Provider': provider },
    ...options,
  });
}

function convertAddressPositionDapp(
  dapp: AddressPositionDappInfo | null
): DefiSdkAddressPositionDappInfo | null {
  if (!dapp) {
    return null;
  }
  const { iconUrl, ...rest } = dapp;
  return { ...rest, icon_url: iconUrl };
}

function convertAssetPrice(price: Price | null): DefiSdkAsset['price'] {
  if (!price) {
    return null;
  }
  return {
    changed_at: price.changedAt,
    relative_change_24h: price.relativeChange24h,
    value: price.value,
  };
}

function convertAsset(asset: Asset): DefiSdkAsset {
  const { id, iconUrl, price, isDisplayable, isVerified, ...rest } = asset;
  return {
    ...rest,
    icon_url: iconUrl,
    is_displayable: isDisplayable,
    is_verified: isVerified,
    asset_code: id,
    id,
    decimals: 18,
    type: null,
    price: convertAssetPrice(price),
  };
}

export function toAddressPosition(
  position: WalletPosition
): DefiSdkAddressPosition {
  const {
    asset,
    includedInChart,
    parentId,
    isDisplayable,
    dapp,
    chain,
    ...rest
  } = position;
  return {
    ...rest,
    chain: chain.id,
    included_in_chart: includedInChart,
    is_displayable: isDisplayable,
    parent_id: parentId,
    dapp: convertAddressPositionDapp(dapp),
    asset: convertAsset(asset),
  };
}

export function toAddressPositions(
  response: WalletGetPositionsResponse
): ResponseBody<DefiSdkAddressPosition[]> {
  return {
    ...response,
    data: response.data?.map((position) => toAddressPosition(position)) ?? null,
  };
}

import { invariant } from 'src/shared/invariant';
import type { ClientOptions } from '../shared';
import { CLIENT_DEFAULTS, ZerionHttpClient } from '../shared';
import type { ZerionApiContext } from '../zerion-api-bare';
import type { ResponseBody } from './ResponseBody';
import type { SignedPermit } from './wallet-prepare-permits';

export type GroupedPositionsGroupBy =
  | 'by-position'
  | 'by-app'
  | 'by-chain'
  | 'by-wallet';

export type GroupedPositionsSortBy =
  | 'value'
  | 'relativeChange24h'
  | 'updatedAt';

export interface Params {
  /** Wallet addresses (1–100) */
  addresses: string[];
  currency: string;
  /** Chain IDs (up to 10) */
  chainIds?: string[];
  /** Asset IDs (up to 30) */
  assetIds?: string[];
  /** 1–2 axes; `positions` is the by-position list, `apps` / `chains` / `wallets` the other axes */
  groupBy: GroupedPositionsGroupBy[];
  /** @default 'value' */
  positionSort?: GroupedPositionsSortBy;
  /** When true, hides positions with small balances */
  hideSmallBalance?: boolean;
  /** Asset IDs to exclude from the response */
  hiddenFungibleIds?: string[];
  /**
   * Signed decryption permits unlocking confidential amounts. Send every
   * permit held for the requested wallets; the server matches them. Capped at
   * 10 per request (400 above the cap). A rejected or expired permit is a 401.
   */
  permits?: SignedPermit[];
}

export interface PositionChain {
  id: string;
  /** @example Ethereum */
  name: string;
  iconUrl: string;
  testnet?: boolean;
}

export interface PositionAssetPrice {
  value: number;
  /** Relative change in the price over the last 24 hours, in percent */
  relativeChange24h: number | null;
  /** Timestamp of the last price change, -1 when unknown */
  changedAt: number;
}

export interface PositionAsset {
  id: string;
  name: string;
  symbol: string;
  implementations: {
    [chainId: string]: { address: string | null; decimals: number };
  };
  iconUrl: string | null;
  price: PositionAssetPrice | null;
  isDisplayable: boolean;
  isVerified: boolean;
  isNew: boolean;
}

/** `asset` for plain holdings, the rest for positions inside an app */
export type PositionType =
  | 'asset'
  | 'deposit'
  | 'loan'
  | 'reward'
  | 'staked'
  | 'locked'
  | 'investment';

/**
 * One asset's holding summed across every chain it sits on (and, inside an
 * app, across that app's contracts). The unit every read-only positions
 * surface renders.
 */
export interface GroupedFungiblePosition {
  id: string;
  asset: PositionAsset;
  /** Quantity in token units (decimals already applied) */
  convertedQuantity: number;
  type: PositionType;
  chains: PositionChain[];
  /** Total value of the position in this group */
  value: number;
  /** Indicates if the position is displayable in the UI */
  isDisplayable?: boolean;
  /** Format: date-time */
  updatedAt?: string;
  /** Block number at last update, null if not applicable */
  updatedAtBlock?: number | null;
  /** Change of the position's value over the last 24 hours, in percent */
  relativeChange24h?: number | null;
  /** Change of the position's value over the last 24 hours, in the requested currency */
  absoluteChange24h?: number | null;
  /**
   * Confidential (e.g. Zama FHE) position: quantity/value are encrypted
   * on-chain and arrive zeroed until a matching Signed Permit is attached
   */
  encrypted?: boolean;
}

export interface AppInfo {
  id: string;
  name: string;
  iconUrl: string | null;
  url: string | null;
}

/** A named list of positions inside an app: "Deposited", "Staked", "Rewards", "Debt"… */
export interface AppPortfolioGroup {
  name: string;
  fungiblePositions: GroupedFungiblePosition[];
}

/**
 * One app's (protocol's) slice of the wallet. The plain holdings outside any
 * app come back as an app too — id `wallet`, one unnamed group.
 */
export interface AppPortfolio {
  app: AppInfo;
  /** Percentage allocation of the app in the portfolio */
  percentageAllocation: number;
  /** Total value of positions in this app */
  value: number;
  groups: AppPortfolioGroup[];
}

export interface ChainPortfolio {
  chain: PositionChain;
  percentageAllocation: number;
  value: number;
  /** Fungible positions on this chain after filtering */
  positions: GroupedFungiblePosition[];
}

export interface WalletPortfolioEntry {
  wallet: {
    name: string;
    iconUrl: string | null;
    address: string;
    premium?: boolean;
    trackable?: boolean;
  };
  value: number;
  relativeChange24h: number;
  absoluteChange24h: number;
  percentageAllocation: number;
}

export interface WalletGroupedPositions {
  /** Every position aggregated by asset; populated when by-position is in groupBy */
  positions?: GroupedFungiblePosition[];
  /** One per app, the `wallet` app included; populated when by-app is in groupBy */
  apps?: AppPortfolio[];
  /** Populated when by-chain is in groupBy */
  chains?: ChainPortfolio[];
  /** Populated when by-wallet is in groupBy; empty otherwise */
  wallets?: WalletPortfolioEntry[];
  totalValue?: number;
}

export type WalletGetGroupedPositionsResponse =
  ResponseBody<WalletGroupedPositions | null>;

export async function walletGetGroupedPositions(
  this: ZerionApiContext,
  params: Params,
  options: ClientOptions = CLIENT_DEFAULTS
) {
  invariant(params.addresses.length > 0, 'Addresses param is empty');
  const firstAddress = params.addresses[0];
  const provider = await this.getAddressProviderHeader(firstAddress);
  const kyOptions = this.getKyOptions();
  const endpoint = 'wallet/get-grouped-positions/v1';
  return ZerionHttpClient.post<WalletGetGroupedPositionsResponse>(
    {
      endpoint,
      body: JSON.stringify(params),
      headers: { 'Zerion-Wallet-Provider': provider },
      ...options,
    },
    kyOptions
  );
}

/** Every position in the response, whichever axis it came back on */
export function flattenGroupedPositions(
  data: WalletGroupedPositions | null | undefined
): GroupedFungiblePosition[] {
  if (!data) {
    return [];
  }
  return [
    ...(data.positions ?? []),
    ...(data.apps ?? []).flatMap((app) =>
      app.groups.flatMap((group) => group.fungiblePositions)
    ),
    ...(data.chains ?? []).flatMap((chain) => chain.positions),
  ];
}

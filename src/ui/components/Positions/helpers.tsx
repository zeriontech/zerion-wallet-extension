import BigNumber from 'bignumber.js';
import type { AddressPosition } from 'src/defi-sdk.types';
import { baseToCommon } from 'src/shared/units/convert';
import { getDecimals } from 'src/modules/networks/asset';
import { createChain } from 'src/modules/networks/Chain';
import type {
  AppPortfolio,
  GroupedFungiblePosition,
  PositionType,
} from './types';
import { DEFAULT_APP_ID, DEFAULT_APP_NAME, DEFAULT_NAME } from './types';

export const positionTypeToStringMap: Record<PositionType, string> = {
  asset: '',
  deposit: 'Deposited',
  loan: 'Debt',
  reward: 'Reward',
  staked: 'Staking',
  locked: 'Locked',
  investment: 'Investment',
};

export function getPositionValue(
  position: Pick<GroupedFungiblePosition, 'value'>
) {
  return Number(position.value) || 0;
}

export function getPositionBalance(
  position: Pick<GroupedFungiblePosition, 'convertedQuantity'>
) {
  return new BigNumber(position.convertedQuantity || 0);
}

/** Sum of values, with debt (`loan`) counted against the rest */
export function getFullPositionsValue(
  positions?: Pick<GroupedFungiblePosition, 'value' | 'type'>[] | null
) {
  return positions
    ? positions.reduce(
        (acc, item) =>
          item.type === 'loan'
            ? acc - getPositionValue(item)
            : acc + getPositionValue(item),
        0
      )
    : 0;
}

/** Sum of |value|: every part counts, so a leveraged App still gets a positive area */
export function getGrossPositionsValue(
  positions?: Pick<GroupedFungiblePosition, 'value'>[] | null
) {
  return positions
    ? positions.reduce((acc, item) => acc + Math.abs(getPositionValue(item)), 0)
    : 0;
}

export function sortPositionsByValue<
  T extends Pick<GroupedFungiblePosition, 'value'>
>(positions?: T[] | null): T[] {
  if (!positions) {
    return [];
  }
  return [...positions].sort(
    (a, b) => getPositionValue(b) - getPositionValue(a)
  );
}

/** Plain holdings hidden by the backend's spam/dust heuristics are dropped; DeFi positions never are */
export function isDisplayablePosition(position: GroupedFungiblePosition) {
  return position.type === 'asset' ? position.isDisplayable !== false : true;
}

export function getAppPositions(app: AppPortfolio): GroupedFungiblePosition[] {
  return app.groups.flatMap((group) => group.fungiblePositions);
}

/** Every position of every App, in App order */
export function flattenApps(
  apps?: AppPortfolio[] | null
): GroupedFungiblePosition[] {
  return apps?.flatMap(getAppPositions) ?? [];
}

/**
 * The backend returns Wallet Bucket holdings with the spam/dust flag intact;
 * drop those rows (and their contribution to the bucket's value) while leaving
 * DeFi Apps untouched.
 */
export function filterDisplayableApps(apps: AppPortfolio[]): AppPortfolio[] {
  return apps
    .map((app) => {
      if (app.app.id !== DEFAULT_APP_ID) {
        return app;
      }
      const groups = app.groups.map((group) => ({
        ...group,
        fungiblePositions: group.fungiblePositions.filter(
          isDisplayablePosition
        ),
      }));
      return {
        ...app,
        groups,
        value: getFullPositionsValue(
          groups.flatMap((group) => group.fungiblePositions)
        ),
      };
    })
    .filter((app) =>
      app.groups.some((group) => group.fungiblePositions.length)
    );
}

/**
 * A single-chain position read from an RPC node (a chain the backend doesn't
 * index), reshaped as the Grouped Position the Overview renders. The node
 * knows the balance but not the price, so `value` is 0 and the row shows no
 * fiat amount.
 */
export function addressPositionToGroupedPosition(
  position: AddressPosition,
  chain: { id: string; name: string; iconUrl: string | null }
): GroupedFungiblePosition {
  const { asset } = position;
  const decimals = getDecimals({ asset, chain: createChain(position.chain) });
  return {
    id: position.id,
    asset: {
      id: asset.id,
      name: asset.name,
      symbol: asset.symbol,
      implementations: asset.implementations ?? {},
      iconUrl: asset.icon_url,
      price: asset.price
        ? {
            value: asset.price.value,
            relativeChange24h: asset.price.relative_change_24h,
            changedAt: asset.price.changed_at,
          }
        : null,
      isDisplayable: asset.is_displayable,
      isVerified: asset.is_verified,
      isNew: false,
    },
    convertedQuantity: baseToCommon(
      position.quantity || 0,
      decimals
    ).toNumber(),
    type: position.type === 'asset' ? 'asset' : position.type,
    chains: [{ id: chain.id, name: chain.name, iconUrl: chain.iconUrl ?? '' }],
    value: Number(position.value) || 0,
    isDisplayable: position.is_displayable,
    encrypted: position.encrypted,
  };
}

/** Wraps node-sourced positions as the one Wallet Bucket App the list expects */
export function addressPositionsToApps(
  positions: AddressPosition[],
  chain: { id: string; name: string; iconUrl: string | null }
): AppPortfolio[] {
  const fungiblePositions = positions.map((position) =>
    addressPositionToGroupedPosition(position, chain)
  );
  return [
    {
      app: {
        id: DEFAULT_APP_ID,
        name: DEFAULT_APP_NAME,
        iconUrl: null,
        url: null,
      },
      percentageAllocation: 100,
      value: getFullPositionsValue(fungiblePositions),
      groups: [{ name: DEFAULT_NAME, fungiblePositions }],
    },
  ];
}

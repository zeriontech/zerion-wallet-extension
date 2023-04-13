/**
 * Taken and adapted from pulse-frontend/Root/App/Main/tabs/Overview/Positions/groupPositions.ts
 */
import type { AddressPosition } from 'defi-sdk';
import groupBy from 'lodash/groupBy';
import type { Chain } from 'src/modules/networks/Chain';
import { getPositionValue, getFullPositionsValue } from './helpers';
import { DEFAULT_NAME, DEFAULT_PROTOCOL } from './types';

const DEFAULT_PARENT_ID = 'root';

export function groupPositionsByName(positions?: AddressPosition[]) {
  return groupBy<AddressPosition>(
    positions || [],
    (position) => position.name || DEFAULT_NAME
  );
}

export function groupPositionsByProtocol(positions?: AddressPosition[]) {
  return groupBy<AddressPosition>(
    positions || [],
    (position) => position.protocol || DEFAULT_PROTOCOL
  );
}

export function sortPositionsByValue(
  positions?: AddressPosition[] | null
): AddressPosition[] {
  if (!positions) {
    return [];
  }

  return positions.sort((a, b) => getPositionValue(b) - getPositionValue(a));
}

export const sortPositionGroupsByTotalValue = (
  positionGroups?: Record<string, AddressPosition[] | undefined>
) =>
  Object.entries(positionGroups || {}).sort(
    (a, b) => getFullPositionsValue(b[1]) - getFullPositionsValue(a[1])
  );

/*
 * If there's no position found for `parent_id`, set `parent_id` to null
 * so that view components do not assume it exists
 */
export const clearMissingParentIds = (positions?: AddressPosition[]) => {
  if (!positions) {
    return [];
  }

  const positionsByIdMap = positions.reduce<Record<string, AddressPosition>>(
    (acc, item) => {
      acc[item.id] = item;
      return acc;
    },
    {}
  );

  return positions.map((position) =>
    position.parent_id && !positionsByIdMap[position.parent_id]
      ? { ...position, parent_id: null }
      : position
  );
};

/**
 * We need to put positions with parent_id right after their parent.
 * Also all positions should be sorted by value in their groups
 * (root group or children group after any parent position)
 *
 * position1
 * position11 -|
 * position12  | child group for position1 (sorted by value)
 * position13 -|
 * position2
 * position3
 * position31 -| child group for position3 (sorted by value)
 * position32 -|
 *
 * (group position1|position2|position3 sorted by value too)
 */
export function sortPositionsByParentId(
  positions?: AddressPosition[]
): AddressPosition[] {
  if (!positions) {
    return [];
  }

  const positionsByParentIdMap = groupBy<AddressPosition>(
    positions || [],
    (position) => position.parent_id || DEFAULT_PARENT_ID
  );

  return sortPositionsByValue(positionsByParentIdMap[DEFAULT_PARENT_ID]).reduce<
    AddressPosition[]
  >((acc, item) => {
    acc.push(item);
    acc.push(...(sortPositionsByValue(positionsByParentIdMap[item.id]) || []));
    return acc;
  }, []);
}

export function groupWalletPositionsByChain(positions: AddressPosition[]) {
  return positions.reduce<{
    [key: string]: { [key: string]: AddressPosition };
  }>((acc, item) => {
    if (!item.asset) {
      return acc;
    }
    acc[item.chain] = acc[item.chain] || {};
    item.asset.asset_code = item.asset.asset_code || item.asset.id;
    // we need to show only asset balances in exchange form
    // to provide correct numbers in suggestions
    if (item.type === 'asset') {
      acc[item.chain][item.asset.asset_code] = item;
    }
    return acc;
  }, {});
}

export const walletPositionsToCollection = (
  positions: AddressPosition[],
  chain: Chain
) => {
  if (!positions) {
    return null;
  }
  return positions
    .filter(
      (position) =>
        Boolean(position.asset) &&
        position.type === 'asset' &&
        position.chain === chain.toString()
    )
    .reduce<Record<string, AddressPosition>>((acc, position) => {
      acc[position.asset.id || position.asset.asset_code] = position;
      return acc;
    }, {});
};

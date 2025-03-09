import { sortPositionsByValue } from '@zeriontech/transactions';
import type { AddressPosition } from 'defi-sdk';
import type { Chain } from 'src/modules/networks/Chain';

export function getAvailablePositions({
  positions,
  supportedTokens,
  chain,
}: {
  positions?: AddressPosition[] | null;
  supportedTokens?: string[] | null;
  chain?: Chain | null;
}) {
  if (!positions || !supportedTokens || !chain) {
    return null;
  }

  const supportedTokensSet = new Set(supportedTokens);
  const availablePositions = positions.filter(
    (position) =>
      position.type === 'asset' &&
      position.chain === chain.toString() &&
      supportedTokensSet.has(position.asset.asset_code)
  );

  const sorted = sortPositionsByValue(availablePositions);
  const map: Record<string, AddressPosition> = {};

  for (const position of sorted) {
    map[position.asset.asset_code] = position;
  }

  return { sorted, map };
}

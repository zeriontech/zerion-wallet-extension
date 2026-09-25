import { minus } from 'src/ui/shared/typography';
import type { GroupedFungiblePosition } from 'src/ui/components/Positions/types';
import {
  getPositionChange24h,
  getPositionValue,
} from 'src/ui/components/Positions/change24h';

export function getColor(value?: number) {
  return !value
    ? 'var(--black)'
    : value > 0
    ? 'var(--positive-500)'
    : 'var(--negative-500)';
}

export function getSign(value?: number) {
  return !value ? '' : value > 0 ? '+' : minus;
}

export interface AssetChange24h {
  /** In percent; null when the value 24h ago is not positive, so no percentage makes sense */
  relative: number | null;
  /** In the requested currency */
  absolute: number;
}

/**
 * The wallet's 24h Return in one asset, summed over the asset's Grouped
 * Positions (wallet holding plus any App positions). A single position keeps
 * the backend's figures verbatim; several are summed and the percentage is
 * re-derived against the combined value 24h ago. Null when no position
 * carries a change.
 */
export function getAssetChange24h(
  positions: GroupedFungiblePosition[]
): AssetChange24h | null {
  const changes = positions
    .map((position) => ({
      change: getPositionChange24h(position),
      value: getPositionValue(position),
    }))
    .filter((item) => item.change != null);
  if (changes.length === 0) {
    return null;
  }
  if (changes.length === 1) {
    return changes[0].change;
  }
  const absolute = changes.reduce(
    (sum, item) => sum + item.change!.absolute,
    0
  );
  const value = changes.reduce((sum, item) => sum + item.value, 0);
  const base = value - absolute;
  return { relative: base > 0 ? (absolute / base) * 100 : null, absolute };
}

import { getAbsoluteChange24h } from 'src/shared/units/getAbsoluteChange24h';
import type { GroupedFungiblePosition } from './types';

export function getPositionValue(
  position: Pick<GroupedFungiblePosition, 'value'>
) {
  return Number(position.value) || 0;
}

export interface PositionChange24h {
  /** In percent */
  relative: number;
  /** In the requested currency */
  absolute: number;
}

/**
 * The 24h Return of one Grouped Position: the backend's own figure for the
 * position when it sends one, otherwise the asset's price move applied to
 * the value (with the value 24h ago as the base).
 */
export function getPositionChange24h(
  position: Pick<
    GroupedFungiblePosition,
    'value' | 'relativeChange24h' | 'absoluteChange24h'
  > & { asset: Pick<GroupedFungiblePosition['asset'], 'price'> }
): PositionChange24h | null {
  const value = getPositionValue(position);
  if (position.relativeChange24h != null) {
    const relative = position.relativeChange24h;
    const absolute =
      position.absoluteChange24h ?? getAbsoluteChange24h(value, relative / 100);
    return { relative, absolute };
  }
  const priceChange = position.asset.price?.relativeChange24h;
  if (priceChange == null) {
    return null;
  }
  return {
    relative: priceChange,
    absolute: getAbsoluteChange24h(value, priceChange / 100),
  };
}

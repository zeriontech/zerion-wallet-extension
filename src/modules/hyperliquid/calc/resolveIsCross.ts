import type { PerpLeverage } from '../api/requests/perp-clearinghouse-state.types';

/**
 * Margin type to send with an order intent. Hyperliquid rejects flipping
 * cross/isolated while a position is open, so an existing position dictates
 * the type. Greenfield opens default to cross, except on isolated-only assets
 * (`onlyIsolated` in meta, e.g. most builder-DEX markets), where Hyperliquid
 * rejects cross margin.
 */
export function resolveIsCross({
  positionMarginType,
  onlyIsolated,
}: {
  positionMarginType: PerpLeverage['type'] | null;
  onlyIsolated?: boolean;
}): boolean {
  if (positionMarginType != null) {
    return positionMarginType === 'cross';
  }
  return !onlyIsolated;
}

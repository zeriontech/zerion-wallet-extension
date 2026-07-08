import type React from 'react';

/**
 * How a {DistributionChart} renders its items: `'grid'` is the squarified
 * treemap; `'lines'` is a sorted list with a proportional accent fill per row.
 */
export type DistributionView = 'grid' | 'lines';

/**
 * One group fed into a {DistributionChart}. The generic chart is
 * data-agnostic: adapters (network / protocol) translate their domain data
 * into these items.
 */
export interface DistributionItem {
  /** Stable identity (chain id or `dapp.id`). */
  id: string;
  /** Human-readable name shown in the tooltip. */
  label: string;
  /** Positive fiat value in the active currency. Non-positive items are dropped. */
  value: number;
  /** Icon URL rendered centered in the tile (and used for accent extraction). */
  iconUrl?: string | null;
  /**
   * Optional pre-rendered icon node, used when there is no URL (e.g. the
   * Wallet bucket's glyph). Takes precedence over {iconUrl} for rendering;
   * accent extraction still relies on {iconUrl}/{accent}.
   */
  iconNode?: React.ReactNode;
  /**
   * Hardcoded accent as `[r, g, b]`. When absent, the accent is extracted
   * from {iconUrl} client-side (see ADR-0003). Always neutral for `Others`.
   */
  accent?: [number, number, number];
  /** Marks the trailing aggregated "Others" tile (neutral, no icon). */
  isOthers?: boolean;
}

/** A laid-out tile: an item plus its pixel rect within the chart. */
export interface DistributionTile {
  item: DistributionItem;
  x: number;
  y: number;
  w: number;
  h: number;
}

import type { Perp } from 'src/modules/zerion-api/requests/search-query';
import type { PerpMetaAndAssetCtxsResponse } from './api/requests/perp-meta-and-asset-ctxs.types';
import { getPerpIconUrl } from './getPerpIconUrl';
import { getPerpDisplayName } from './parsePerpId';

export type PerpSortField = 'volume' | 'price' | 'change';
export type PerpSortDirection = 'asc' | 'desc';

export interface PerpSorting {
  field: PerpSortField;
  direction: PerpSortDirection;
}

export const DEFAULT_SORTING: PerpSorting = {
  field: 'volume',
  direction: 'desc',
};

function toNumber(value: string | null | undefined): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function toPerp(
  asset: PerpMetaAndAssetCtxsResponse[0]['universe'][number],
  ctx: PerpMetaAndAssetCtxsResponse[1][number]
): Perp {
  const markPx = toNumber(ctx.markPx);
  const prevDayPx = toNumber(ctx.prevDayPx);
  const relativeChange1d =
    markPx != null && prevDayPx != null && prevDayPx !== 0
      ? (markPx - prevDayPx) / prevDayPx
      : null;
  const volume24h = toNumber(ctx.dayNtlVlm);
  // `asset.name` is the full Hyperliquid identifier (`BTC`, `xyz:NVDA`);
  // `symbol` drops the DEX prefix for display.
  const symbol = getPerpDisplayName(asset.name);

  return {
    id: asset.name,
    name: asset.name,
    symbol,
    iconUrl: getPerpIconUrl(asset.name),
    verified: !asset.isDelisted,
    new: false,
    meta: {
      price: markPx,
      relativeChange1d,
      maxLeverage: asset.maxLeverage,
      volume24h,
    },
  };
}

function pickSortValue(perp: Perp, field: PerpSortField): number | null {
  if (field === 'volume') return perp.meta.volume24h ?? null;
  if (field === 'price') return perp.meta.price ?? null;
  return perp.meta.relativeChange1d ?? null;
}

/**
 * Ported from the web app's `src/pages/Explore/pages/Perps/selectPerps.ts`
 * (PR #7). Extended for the extension: `data` is an array of
 * `PerpMetaAndAssetCtxsResponse` — one per DEX — and the universes are merged
 * into a single sorted list. The web app keeps perps and tokenized stocks on
 * separate pages (one DEX each); the extension overview has no room for tabs,
 * so every DEX is folded into one Markets list. See ADR-0002.
 */
export function selectPerps(
  data: Array<PerpMetaAndAssetCtxsResponse | null | undefined>,
  {
    sorting,
    query,
    limit,
  }: {
    sorting: PerpSorting;
    query?: string;
    limit?: number;
  }
): Perp[] {
  const items: Perp[] = [];
  for (const entry of data) {
    if (!entry) continue;
    const [meta, ctxs] = entry;
    for (let i = 0; i < meta.universe.length; i += 1) {
      const asset = meta.universe[i];
      if (asset.isDelisted) continue;
      const ctx = ctxs[i];
      if (!ctx) continue;
      items.push(toPerp(asset, ctx));
    }
  }

  const trimmedQuery = query?.trim().toLowerCase() ?? '';
  const filtered = trimmedQuery
    ? items.filter((perp) => {
        const symbol = perp.symbol.toLowerCase();
        const name = perp.name.toLowerCase();
        return symbol.includes(trimmedQuery) || name.includes(trimmedQuery);
      })
    : items;

  const sortMultiplier = sorting.direction === 'desc' ? -1 : 1;
  const sorted = [...filtered].sort((a, b) => {
    const av = pickSortValue(a, sorting.field);
    const bv = pickSortValue(b, sorting.field);
    // `null` metrics always sort last, regardless of direction.
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    return (av - bv) * sortMultiplier;
  });

  return limit != null ? sorted.slice(0, limit) : sorted;
}

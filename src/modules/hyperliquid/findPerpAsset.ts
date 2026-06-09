import type {
  PerpAssetMarketData,
  PerpMetaAndAssetCtxsResponse,
  PerpUniverseAsset,
} from './api/requests/perp-meta-and-asset-ctxs.types';

export interface PerpAssetEntry {
  index: number;
  universe: PerpUniverseAsset;
  ctx: PerpAssetMarketData;
}

export function findPerpAsset(
  data: PerpMetaAndAssetCtxsResponse | null | undefined,
  coin: string
): PerpAssetEntry | null {
  if (!data) return null;
  const [meta, ctxs] = data;
  const index = meta.universe.findIndex(
    (item) => item.name.toLowerCase() === coin.toLowerCase()
  );
  if (index === -1) return null;
  const universe = meta.universe[index];
  const ctx = ctxs[index];
  if (!universe || !ctx) return null;
  return { index, universe, ctx };
}

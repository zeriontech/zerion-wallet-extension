export interface PerpUniverseAsset {
  name: string;
  szDecimals: number;
  maxLeverage: number;
  onlyIsolated?: boolean;
  isDelisted?: boolean;
}

export interface PerpMeta {
  universe: PerpUniverseAsset[];
}

export interface PerpAssetMarketData {
  funding: string;
  openInterest: string;
  prevDayPx: string;
  dayNtlVlm: string;
  premium: string | null;
  oraclePx: string;
  markPx: string;
  midPx: string | null;
  impactPxs: string[] | null;
  dayBaseVlm: string;
}

export type PerpMetaAndAssetCtxsResponse = [PerpMeta, PerpAssetMarketData[]];

export interface PerpMetaAndAssetCtxsPayload {
  dexIdentifier?: string;
}

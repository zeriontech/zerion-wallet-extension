export interface PerpLeverage {
  type: 'cross' | 'isolated';
  value: number;
  rawUsd?: string;
}

export interface PerpCumFunding {
  allTime: string;
  sinceChange: string;
  sinceOpen: string;
}

export interface PerpPosition {
  coin: string;
  szi: string;
  entryPx: string;
  positionValue: string;
  leverage: PerpLeverage;
  marginUsed: string;
  unrealizedPnl: string;
  returnOnEquity: string;
  liquidationPx: string | null;
  maxLeverage: number;
  cumFunding: PerpCumFunding;
}

export interface PerpAssetPositionEntry {
  type: string;
  position: PerpPosition;
}

export interface PerpMarginSummary {
  accountValue: string;
  totalNtlPos: string;
  totalRawUsd: string;
  totalMarginUsed: string;
}

export interface PerpClearinghouseState {
  marginSummary: PerpMarginSummary;
  crossMarginSummary: PerpMarginSummary;
  withdrawable: string;
  assetPositions: PerpAssetPositionEntry[];
  time: number;
}

export interface PerpClearinghouseStatePayload {
  address: string;
  dexIdentifier?: string;
}

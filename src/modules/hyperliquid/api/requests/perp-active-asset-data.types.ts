import type { PerpLeverage } from './perp-clearinghouse-state.types';

export interface PerpActiveAssetData {
  user: string;
  coin: string;
  leverage: PerpLeverage;
  maxTradeSzs: [string, string];
  availableToTrade: [string, string];
  markPx: string;
}

export interface PerpActiveAssetDataPayload {
  address: string;
  coin: string;
}

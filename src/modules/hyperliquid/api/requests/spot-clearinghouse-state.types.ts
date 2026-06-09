// Source-of-truth for unified-account spot balances. Unlike `webData2.spotState`,
// this endpoint reports `total` as the full holding (free + locked-as-margin) and
// `hold` as the amount currently locked as margin.
export interface SpotBalance {
  coin: string;
  token: number;
  total: string;
  hold: string;
  entryNtl: string;
}

export interface SpotClearinghouseState {
  balances: SpotBalance[];
}

export interface SpotClearinghouseStatePayload {
  address: string;
}

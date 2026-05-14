export type PerpCandleInterval =
  | '1m'
  | '5m'
  | '15m'
  | '1h'
  | '12h'
  | '1d'
  | '1w'
  | '1M';

export interface PerpCandle {
  t: number;
  T: number;
  s: string;
  i: string;
  o: string;
  c: string;
  h: string;
  l: string;
  v: string;
  n: number;
}

export interface PerpCandleSnapshotPayload {
  coin: string;
  interval: PerpCandleInterval;
  startTime: number;
  endTime: number;
}

import type { PerpCandleInterval } from './api/requests/perp-candle-snapshot.types';

const MS = {
  minute: 60 * 1000,
  hour: 60 * 60 * 1000,
  day: 24 * 60 * 60 * 1000,
  week: 7 * 24 * 60 * 60 * 1000,
  month: 30 * 24 * 60 * 60 * 1000,
  year: 365 * 24 * 60 * 60 * 1000,
};

export const PERP_INTERVALS: PerpCandleInterval[] = [
  '1m',
  '5m',
  '15m',
  '1h',
  '12h',
  '1d',
  '1w',
  '1M',
];

export const DEFAULT_PERP_INTERVAL: PerpCandleInterval = '1h';

const RANGE_MS: Record<PerpCandleInterval, number> = {
  '1m': 3 * MS.hour,
  '5m': 12 * MS.hour,
  '15m': 2 * MS.day,
  '1h': 7 * MS.day,
  '12h': 90 * MS.day,
  '1d': 6 * MS.month,
  '1w': 3 * MS.year,
  '1M': 10 * MS.year,
};

export function getIntervalRange(interval: PerpCandleInterval): {
  startTime: number;
  endTime: number;
} {
  const endTime = Date.now();
  return { startTime: endTime - RANGE_MS[interval], endTime };
}

export function intervalLabel(interval: PerpCandleInterval): string {
  if (interval === '1d') return '1D';
  if (interval === '1w') return '1W';
  return interval;
}

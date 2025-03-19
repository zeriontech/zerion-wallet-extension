import { formatPercent } from './formatPercent';

export interface PercentChangeInfo {
  isPositive: boolean;
  isNegative: boolean;
  isNonNegative: boolean;
  isZero: boolean;
  formatted: string;
}

export function formatPercentChange(
  value: number,
  locale: string
): PercentChangeInfo {
  return {
    isPositive: value > 0,
    isNonNegative: value >= 0,
    isNegative: value < 0,
    isZero: value === 0,
    formatted: `${formatPercent(value, locale)}%`,
  };
}

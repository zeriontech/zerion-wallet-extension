import { Theme } from 'src/ui/features/appearance';
import type { ChartPoint } from './types';

export function toScatterData<T>(points: ChartPoint<T>[]) {
  return points.map(([x, y, extra]) => ({ x, y, extra }));
}

export function getChartColor({
  theme,
  isPositive,
  isHighlighted,
}: {
  theme: Theme;
  isPositive: boolean;
  isHighlighted: boolean;
}) {
  return isPositive
    ? theme === Theme.light
      ? isHighlighted
        ? '#99dbb4'
        : '#1fc260'
      : isHighlighted
      ? '#2d4435'
      : '#31b566'
    : theme === Theme.light
    ? isHighlighted
      ? '#ffd0c9'
      : '#ff4a4a'
    : isHighlighted
    ? '#8a393b'
    : '#ff5c5c';
}

export function getSortedRangeIndexes({
  startRangeIndex,
  endRangeIndex,
}: {
  startRangeIndex: number | null;
  endRangeIndex: number | null;
}) {
  if (startRangeIndex === null) {
    return { startRangeIndex, endRangeIndex };
  }
  if (endRangeIndex === null) {
    return { startRangeIndex: endRangeIndex, endRangeIndex: startRangeIndex };
  }
  if (startRangeIndex > endRangeIndex) {
    return { startRangeIndex: endRangeIndex, endRangeIndex: startRangeIndex };
  }
  return { startRangeIndex, endRangeIndex };
}

/**
 * For the charts with small value dispersion, we need to show it more flat
 * to avoid the illusion of big price changes
 */
const FLAT_CHART_MIN_MAX_RATIO = 1.02;

export function getYLimits(points: ChartPoint[]) {
  const values = points.map(([, value]) => value);
  const minLimit = Math.min(...values);
  const maxLimit = Math.max(...values);
  const diff = maxLimit - minLimit;
  if (minLimit && maxLimit / minLimit < FLAT_CHART_MIN_MAX_RATIO) {
    const flatChartYOffset = diff * 5;
    return {
      min: minLimit - flatChartYOffset,
      max: maxLimit + flatChartYOffset,
    };
  }
  return { min: minLimit, max: maxLimit };
}

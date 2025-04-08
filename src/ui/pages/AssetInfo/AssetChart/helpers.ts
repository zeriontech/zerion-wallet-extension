import { Theme } from 'src/ui/features/appearance';

export function toScatterData(points: [number, number][]) {
  return points.map(([x, y]) => ({ x, y }));
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
        : '#01a643'
      : isHighlighted
      ? '#2d4435'
      : '#4fbf67'
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
export function getYLimits(points: [number, number][]) {
  const values = points.map(([, value]) => value);
  const minLimit = Math.min(...values);
  const maxLimit = Math.max(...values);
  const diff = maxLimit - minLimit;
  if (minLimit && maxLimit / minLimit < 1.02) {
    return { min: minLimit - diff * 5, max: maxLimit + diff * 5 };
  }
  return { min: minLimit, max: maxLimit };
}

import { Theme } from 'src/ui/features/appearance';
import { capitalize } from 'capitalize-ts';
import BigNumber from 'bignumber.js';
import { formatTokenValue } from 'src/shared/units/formatTokenValue';
import { formatPriceValue } from 'src/shared/units/formatPriceValue';
import type { AssetChartActions } from 'src/modules/zerion-api/requests/asset-get-chart';
import type { Asset } from 'src/modules/zerion-api/requests/asset-get-fungible-full-info';
import { minus } from 'src/ui/shared/typography';
import type { ChartPoint } from './types';

export function toScatterData(points: ChartPoint[]) {
  return points.map(([x, y, actions]) => ({ x, y, actions }));
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

export function serializeAssetChartActions({
  action,
  asset,
  currency,
}: {
  action: AssetChartActions['total'];
  asset: Asset;
  currency: string;
}) {
  return JSON.stringify({
    title: capitalize(action.type || 'total'),
    balance: `${
      new BigNumber(action.quantity).isPositive() ? '+' : minus
    }${formatTokenValue(new BigNumber(action.quantity).abs(), asset.symbol, {
      notation: new BigNumber(action.quantity).gte(100000)
        ? 'compact'
        : undefined,
    })}`,
    value: formatPriceValue(Math.abs(action.value), 'en', currency),
    direction: action.direction,
  });
}

export function deserializeAssetChartActions(data: string) {
  const parsedActions = JSON.parse(data);
  return {
    title: parsedActions.title as string,
    balance: parsedActions.balance as string,
    value: parsedActions.value as string,
    direction:
      parsedActions.direction as AssetChartActions['total']['direction'],
  };
}

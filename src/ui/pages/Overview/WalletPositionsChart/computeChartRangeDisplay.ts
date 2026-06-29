import dayjs from 'dayjs';
import { formatCurrencyValue } from 'src/shared/units/formatCurrencyValue';
import { formatPercent } from 'src/shared/units/formatPercent';
import type { ChartPoint } from 'src/ui/components/chart/types';
import { getColor, getSign } from 'src/ui/pages/AssetInfo/helpers';

/**
 * Normalize the leaf's raw selection into an ascending `[start, end]`. Mirrors
 * `getSortedRangeIndexes` from the chart leaf, inlined to keep this module free
 * of the leaf's `Theme` import (which isn't loadable in the Jest ESM runner).
 */
function sortRangeIndexes(
  startRangeIndex: number | null,
  endRangeIndex: number | null
): { start: number | null; end: number | null } {
  if (startRangeIndex === null) {
    return { start: startRangeIndex, end: endRangeIndex };
  }
  if (endRangeIndex === null) {
    return { start: null, end: startRangeIndex };
  }
  if (startRangeIndex > endRangeIndex) {
    return { start: endRangeIndex, end: startRangeIndex };
  }
  return { start: startRangeIndex, end: endRangeIndex };
}

/** The wallet chart carries no per-point metadata (unlike the asset chart). */
export type WalletChartPoint = ChartPoint<null>;

export interface ChartRangeDisplayParams {
  points: WalletChartPoint[];
  startRangeIndex: number | null;
  endRangeIndex: number | null;
  currency: string;
  hideBalances: boolean;
}

export interface ChartRangeDisplay {
  /** Formatted fiat balance, or `null` when withheld (hide-balances on / no data). */
  balance: string | null;
  /** Signed percent change with absolute fiat change (e.g. `+12.34% ($56.78)`), or `null` when withheld. */
  change: string | null;
  /** CSS color for the change figure (positive/negative/neutral). */
  changeColor: string;
  /** Date of the hovered point, or `start → end` for a range; empty at rest. */
  date: string;
}

const DATE_FORMAT = 'MMM D, YYYY, HH:mm';

/**
 * Pure helper for the Wallet Positions Chart top readout.
 *
 * Given the chart points and the leaf's selection indices, it returns the
 * display strings for balance, change (percent + sign + color) and the
 * date/date-range label. Rules:
 *
 * - Rest (no selection): balance = last point; change = (last − first) / first.
 * - Single hover: balance = hovered point; change vs the period's first point.
 * - Two-point range: change between the two selected points; `start → end` date.
 * - Hide-balances on: balance and change figures are withheld (returned `null`),
 *   so the orchestrator can blur them and hovering can't leak the numbers.
 *
 * Balance is a fiat amount, so it is formatted with the currency formatter (not
 * the price formatter the asset chart uses).
 */
export function computeChartRangeDisplay({
  points,
  startRangeIndex,
  endRangeIndex,
  currency,
  hideBalances,
}: ChartRangeDisplayParams): ChartRangeDisplay {
  // The leaf already sorts indices, but sort again so the helper is robust on
  // its own (e.g. a range dragged right-to-left).
  const { start, end } = sortRangeIndexes(startRangeIndex, endRangeIndex);

  const firstPoint = points.at(0);
  const lastPoint = points.at(-1);

  // Reference ("from") point: the range start, or the period start at rest.
  const startPoint = start != null ? points.at(start) : firstPoint;
  // Active ("to") point: the hovered/range-end point, or the latest at rest.
  const endPoint = end != null ? points.at(end) : lastPoint;

  const startValue = startPoint?.[1];
  const value = endPoint?.[1];

  const change =
    startValue != null && startValue !== 0 && value != null
      ? ((value - startValue) / startValue) * 100
      : 0;

  const changeAbsolute =
    startValue != null && value != null ? value - startValue : 0;

  // Only show a timestamp once the user is hovering/selecting a point.
  const activeTimestamp = end != null ? endPoint?.[0] : null;
  const activeFormatted = activeTimestamp
    ? dayjs(activeTimestamp).format(DATE_FORMAT)
    : null;
  // Prefix with the start date only for a genuine range (start past the period
  // start); a single hover reads against the period start and needs no prefix.
  const startTimestamp = startPoint?.[0];
  const initialFormatted =
    activeFormatted &&
    start != null &&
    startTimestamp != null &&
    startTimestamp !== firstPoint?.[0]
      ? `${dayjs(startTimestamp).format(DATE_FORMAT)} → `
      : '';
  const date = activeFormatted ? `${initialFormatted}${activeFormatted}` : '';

  if (hideBalances || value == null) {
    return {
      balance: null,
      change: null,
      changeColor: getColor(change),
      date,
    };
  }

  return {
    balance: formatCurrencyValue(value, 'en', currency),
    // Percent + absolute fiat change in parentheses, mirroring the Overview's
    // total-balance change line (e.g. `-1.09% ($22.49)`).
    change: `${getSign(change)}${formatPercent(
      Math.abs(change),
      'en'
    )}% (${formatCurrencyValue(Math.abs(changeAbsolute), 'en', currency)})`,
    changeColor: getColor(change),
    date,
  };
}

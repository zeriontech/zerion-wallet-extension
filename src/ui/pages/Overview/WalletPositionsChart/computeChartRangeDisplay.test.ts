import dayjs from 'dayjs';
import { minus } from 'src/ui/shared/typography';
import {
  computeChartRangeDisplay,
  type WalletChartPoint,
} from './computeChartRangeDisplay';

const POSITIVE_COLOR = 'var(--positive-500)';
const NEGATIVE_COLOR = 'var(--negative-500)';
const NEUTRAL_COLOR = 'var(--black)';
const DATE_FORMAT = 'MMM D, YYYY, HH:mm';

// timestamps in ms, values in fiat
const points: WalletChartPoint[] = [
  [1_000, 100, null],
  [2_000, 110, null],
  [3_000, 90, null],
  [4_000, 150, null],
];

const base = { currency: 'usd', hideBalances: false } as const;

describe('computeChartRangeDisplay', () => {
  test('rest state: latest balance + whole-period change', () => {
    const result = computeChartRangeDisplay({
      ...base,
      points,
      startRangeIndex: null,
      endRangeIndex: null,
    });
    // last point = 150, change = (150 - 100) / 100 = +50%, absolute = $50
    expect(result.balance).toBe('$150.00');
    expect(result.change).toBe('+50% ($50.00)');
    expect(result.changeColor).toBe(POSITIVE_COLOR);
    // no hover -> no date
    expect(result.date).toBe('');
  });

  test('single-point hover: balance at point + change from period start', () => {
    const result = computeChartRangeDisplay({
      ...base,
      points,
      startRangeIndex: null,
      endRangeIndex: 1,
    });
    // point = 110, change vs first (100) = +10%, absolute = $10
    expect(result.balance).toBe('$110.00');
    expect(result.change).toBe('+10% ($10.00)');
    expect(result.changeColor).toBe(POSITIVE_COLOR);
    // single hover reads against period start -> no range prefix
    expect(result.date).toBe(dayjs(2_000).format(DATE_FORMAT));
  });

  test('two-point range: change between the points + date-range label', () => {
    const result = computeChartRangeDisplay({
      ...base,
      points,
      startRangeIndex: 1,
      endRangeIndex: 3,
    });
    // 110 -> 150 = +36.36% (>= 1 -> 1 decimal place), absolute = $40
    expect(result.balance).toBe('$150.00');
    expect(result.change).toBe('+36.4% ($40.00)');
    expect(result.changeColor).toBe(POSITIVE_COLOR);
    expect(result.date).toBe(
      `${dayjs(2_000).format(DATE_FORMAT)} → ${dayjs(4_000).format(
        DATE_FORMAT
      )}`
    );
  });

  test('negative direction is colored and signed', () => {
    const result = computeChartRangeDisplay({
      ...base,
      points,
      startRangeIndex: null,
      endRangeIndex: 2,
    });
    // point = 90, change vs first (100) = -10%, absolute = $10
    expect(result.change).toBe(`${minus}10% ($10.00)`);
    expect(result.changeColor).toBe(NEGATIVE_COLOR);
  });

  test('unordered indices (start after end) are normalized', () => {
    const swapped = computeChartRangeDisplay({
      ...base,
      points,
      startRangeIndex: 3,
      endRangeIndex: 1,
    });
    const ordered = computeChartRangeDisplay({
      ...base,
      points,
      startRangeIndex: 1,
      endRangeIndex: 3,
    });
    expect(swapped).toEqual(ordered);
  });

  test('empty points: figures withheld, no crash', () => {
    const result = computeChartRangeDisplay({
      ...base,
      points: [],
      startRangeIndex: null,
      endRangeIndex: null,
    });
    expect(result.balance).toBeNull();
    expect(result.change).toBeNull();
    expect(result.date).toBe('');
    expect(result.changeColor).toBe(NEUTRAL_COLOR);
  });

  test('single point: zero change, no divide-by-zero', () => {
    const result = computeChartRangeDisplay({
      ...base,
      points: [[1_000, 100, null]],
      startRangeIndex: null,
      endRangeIndex: null,
    });
    expect(result.balance).toBe('$100.00');
    expect(result.change).toBe('0% ($0)');
    expect(result.changeColor).toBe(NEUTRAL_COLOR);
  });

  test('zero first value: change is 0, balance still shown', () => {
    const result = computeChartRangeDisplay({
      ...base,
      points: [
        [1_000, 0, null],
        [2_000, 50, null],
      ],
      startRangeIndex: null,
      endRangeIndex: null,
    });
    // percent guarded to 0 (divide-by-zero), but absolute change = $50
    expect(result.balance).toBe('$50.00');
    expect(result.change).toBe('0% ($50.00)');
    expect(result.changeColor).toBe(NEUTRAL_COLOR);
  });

  test('hide-balances: balance and change are withheld, date kept', () => {
    const result = computeChartRangeDisplay({
      ...base,
      hideBalances: true,
      points,
      startRangeIndex: null,
      endRangeIndex: 1,
    });
    expect(result.balance).toBeNull();
    expect(result.change).toBeNull();
    // color/date are not balances and remain available
    expect(result.changeColor).toBe(POSITIVE_COLOR);
    expect(result.date).toBe(dayjs(2_000).format(DATE_FORMAT));
  });
});

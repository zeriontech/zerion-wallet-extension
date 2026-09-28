/**
 * Absolute change over the last 24 hours of a holding that is worth `value`
 * now, given the relative price change as a fraction (0.5 = +50%).
 *
 * The base is the value 24 hours ago, `value / (1 + relativeChange)`, not the
 * current value — multiplying the current value by the change overstates a
 * gain (and understates a loss). When the price has gone to zero the whole
 * current value is the loss (the base is undefined, `value` is 0 anyway).
 */
export function getAbsoluteChange24h(value: number, relativeChange: number) {
  const base = 1 + relativeChange;
  return base === 0 ? value : (value * relativeChange) / base;
}

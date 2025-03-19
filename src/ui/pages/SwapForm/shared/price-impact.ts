import type BigNumber from 'bignumber.js';

const LOW_THRESHOLD = -0.05;
const HIGH_THRESHOLD = -0.15;

export enum PriceImpact {
  Positive,
  Low,
  Medium,
  High,
}

// x >= 0 => Positive
// -0.05 <= x < 0 => Low
// -0.15 <= x < -0.05 => Medium
// x < -0.15 => High

export function getPriceImpact({
  relativeChange,
}: {
  relativeChange: BigNumber;
}) {
  if (relativeChange.isGreaterThanOrEqualTo(0)) {
    return PriceImpact.Positive;
  } else if (relativeChange.isGreaterThanOrEqualTo(LOW_THRESHOLD)) {
    return PriceImpact.Low;
  } else if (relativeChange.isGreaterThanOrEqualTo(HIGH_THRESHOLD)) {
    return PriceImpact.Medium;
  } else {
    return PriceImpact.High;
  }
}

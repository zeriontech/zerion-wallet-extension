import type BigNumber from 'bignumber.js';

const PRICE_IMPACT_WARNING_THRESHOLD = -0.03;

export function exceedsPriceImpactThreshold({
  relativeChange,
}: {
  relativeChange: BigNumber;
}) {
  return relativeChange.isLessThan(PRICE_IMPACT_WARNING_THRESHOLD);
}

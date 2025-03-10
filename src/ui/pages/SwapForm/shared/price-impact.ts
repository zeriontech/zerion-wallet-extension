import BigNumber from 'bignumber.js';

const PRICE_IMPACT_WARNING_THRESHOLD = -0.05;

export function exceedsPriceImpactThreshold({
  relativeChange,
}: {
  relativeChange: BigNumber | number;
}) {
  return new BigNumber(relativeChange).isLessThan(
    PRICE_IMPACT_WARNING_THRESHOLD
  );
}

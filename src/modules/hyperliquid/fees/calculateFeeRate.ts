// Builder-fee numerator: hyperliquid uses denominator 1_000_000 here, where
// `1` corresponds to 0.0001%. e.g. `100` -> 0.0001 (= 0.01%).
// iOS calls this `BuilderFeeUnit`.
export const BUILDER_FEE_DENOMINATOR = 1_000_000;

export function builderFeeUnitToRate(units: number): number {
  return units / BUILDER_FEE_DENOMINATOR;
}

export function builderFeeUnitToMaxFeeRateString(units: number): string {
  // Hyperliquid expects e.g. "0.001%" for `maxFeeRate` field on the
  // ApproveBuilderFee action. Convert units (denominator 1e6) to a
  // percentage string.
  const percent = (units / BUILDER_FEE_DENOMINATOR) * 100;
  return `${percent}%`;
}

export interface FeeRateInputs {
  userCrossRate: number;
  referralDiscount: number;
  builderFeeUnits: number;
}

export interface FeeBreakdown {
  hyperliquidRate: number;
  zerionRate: number;
  totalRate: number;
}

export function calculateFeeBreakdown({
  userCrossRate,
  referralDiscount,
  builderFeeUnits,
}: FeeRateInputs): FeeBreakdown {
  const hyperliquidRate = userCrossRate * (1 - referralDiscount);
  const zerionRate = builderFeeUnitToRate(builderFeeUnits);
  return {
    hyperliquidRate,
    zerionRate,
    totalRate: hyperliquidRate + zerionRate,
  };
}

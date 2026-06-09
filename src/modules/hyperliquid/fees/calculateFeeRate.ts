// Builder-fee unit: Hyperliquid denominates the order `builder.f` field (and
// the on-chain `maxBuilderFee`) in *tenths of a basis point* — `1` unit =
// 0.001% = 0.00001 as a fraction, i.e. denominator 100_000. The docs: "f is
// the size of the fee in tenths of a basis point e.g. if f is 10, 1bp of the
// order notional will be charged". This matches the remote config's
// self-consistent pair maxApproveBuilderFee "0.1%" ↔ maxApproveBuilderFeeInteger 100.
// iOS calls this `BuilderFeeUnit`.
export const BUILDER_FEE_DENOMINATOR = 100_000;

export function builderFeeUnitToRate(units: number): number {
  return units / BUILDER_FEE_DENOMINATOR;
}

export function builderFeeUnitToMaxFeeRateString(units: number): string {
  // Hyperliquid expects e.g. "0.001%" for the `maxFeeRate` field on the
  // ApproveBuilderFee action. Convert units (tenths of a basis point) to a
  // percentage string: 1 unit = 0.001%, so `100` -> "0.1%".
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

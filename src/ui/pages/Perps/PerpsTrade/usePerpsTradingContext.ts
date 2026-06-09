import { useMemo } from 'react';
import { usePerpsRemoteConfig } from 'src/modules/hyperliquid/hooks/usePerpsRemoteConfig';
import { useUserFees } from 'src/modules/hyperliquid/hooks/useUserFees';
import { calculateFeeBreakdown } from 'src/modules/hyperliquid/fees/calculateFeeRate';
import { useSingleAddressPremiumStatus } from 'src/ui/features/premium/getPremiumStatus';

export interface PerpsTradingContext {
  /** False until Firebase + user-fees have resolved and the builder is configured. */
  isReady: boolean;
  /** Builder address from Firebase. Empty string until ready. */
  builderAddress: string;
  /** Per-order builder fee charged on each order (tenths-of-bps) — premium tier when premium is active. */
  builderFeeUnits: number;
  /**
   * Fixed max builder fee to approve on-chain (tenths-of-bps). Decoupled from
   * the per-order fee so a single approval covers both standard and premium
   * orders and survives premium-tier changes. Must be >= builderFeeUnits.
   */
  maxApproveBuilderFeeUnits: number;
  premiumApplied: boolean;
  referralCode: string;
  /** User's effective Hyperliquid cross-rate after referral discount. */
  hyperliquidRate: number;
  /** Builder (Zerion) rate as a fraction (e.g. 0.0001 == 0.01%). */
  zerionRate: number;
  totalRate: number;
}

export function usePerpsTradingContext({
  address,
}: {
  address: string;
}): PerpsTradingContext {
  const { data: config } = usePerpsRemoteConfig();

  const { isPremium } = useSingleAddressPremiumStatus({ address });

  const { data: userFees } = useUserFees(
    { address },
    { enabled: Boolean(address) }
  );

  return useMemo<PerpsTradingContext>(() => {
    const builderAddress = config?.builderAddress ?? '';
    const standardFee = config?.builderFee ?? 0;
    const premiumFee = config?.builderFeePremium ?? 0;
    const builderFeeUnits =
      isPremium && premiumFee > 0 ? premiumFee : standardFee;
    // Approve a fixed ceiling (from config) rather than the per-order fee, so
    // one approval covers standard + premium and the preflight gate doesn't
    // re-approve when the tier flips. Fall back to the per-order fee if the
    // config cap is missing or somehow below it.
    const maxApproveBuilderFeeUnits = Math.max(
      config?.maxApproveBuilderFeeInteger ?? 0,
      builderFeeUnits
    );
    const referralCode = config?.referralCode ?? '';

    const userCrossRate = Number(userFees?.userCrossRate ?? 0) || 0;
    const referralDiscount = Number(userFees?.activeReferralDiscount ?? 0) || 0;

    const breakdown = calculateFeeBreakdown({
      userCrossRate,
      referralDiscount,
      builderFeeUnits,
    });

    // Fail-closed: trade CTAs are hidden until both Firebase config and user
    // fees have resolved and the builder address is non-empty.
    const isReady =
      Boolean(config) &&
      Boolean(builderAddress) &&
      builderFeeUnits > 0 &&
      userFees != null;

    return {
      isReady,
      builderAddress,
      builderFeeUnits,
      maxApproveBuilderFeeUnits,
      premiumApplied: isPremium && premiumFee > 0,
      referralCode,
      hyperliquidRate: breakdown.hyperliquidRate,
      zerionRate: breakdown.zerionRate,
      totalRate: breakdown.totalRate,
    };
  }, [config, isPremium, userFees]);
}

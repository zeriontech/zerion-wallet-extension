import type { PerpUserRole } from '../api/requests/perp-user-role.types';
import type { PerpReferral } from '../api/requests/perp-referral.types';
import type { PerpClearinghouseState } from '../api/requests/perp-clearinghouse-state.types';
import { perpUserRole } from '../api/requests/perp-user-role.client';
import { perpReferral } from '../api/requests/perp-referral.client';
import { perpMaxBuilderFee } from '../api/requests/perp-max-builder-fee.client';
import { perpClearinghouseState } from '../api/requests/perp-clearinghouse-state.client';

export interface PreflightLeverage {
  value: number;
  isCross: boolean;
}

export interface PreflightState {
  /** Hyperliquid account exists (user role !== 'missing'). */
  hyperliquidEnabled: boolean;
  /** A referral code is already set. */
  referrerSet: boolean;
  /**
   * Approved builder fee covers (or exceeds) the configured max fee rate.
   * Stored in units of 1e6 (e.g. `100` = 0.01%).
   */
  builderFeeApproved: boolean;
  /**
   * For a given perp coin, the current leverage value and margin type of the
   * open position. Null when no position exists for that coin. Both fields
   * matter for preflight: Hyperliquid rejects margin-type flips while a
   * position is open, so the orchestrator needs to know the type, not just
   * the numeric value.
   */
  currentLeverage: PreflightLeverage | null;
}

export interface PreflightFetchInput {
  address: string;
  builder: string;
  /** Required max builder fee (1e6-denominated). Approved value must be >= this. */
  requiredMaxBuilderFee: number;
  /** Asset coin (e.g. "BTC", "xyz:SP500") whose leverage we want to read; optional for flows that don't touch leverage. */
  coin?: string;
  /** Builder-DEX identifier; required to read clearinghouseState from the correct perp account for builder-DEX coins. */
  dexIdentifier?: string;
}

export interface PreflightRawState {
  userRole: PerpUserRole | null;
  referral: PerpReferral | null;
  maxBuilderFee: number | null;
  clearinghouseState: PerpClearinghouseState | null;
}

export function derivePreflightState(
  raw: PreflightRawState,
  input: Pick<PreflightFetchInput, 'requiredMaxBuilderFee' | 'coin'>
): PreflightState {
  const hyperliquidEnabled =
    raw.userRole != null && raw.userRole.role !== 'missing';
  const referrerSet = Boolean(raw.referral?.referredBy);
  const builderFeeApproved =
    raw.maxBuilderFee != null &&
    raw.maxBuilderFee >= input.requiredMaxBuilderFee;
  const coin = input.coin;
  const matchedPosition = coin
    ? raw.clearinghouseState?.assetPositions.find(
        (entry) => entry.position.coin.toLowerCase() === coin.toLowerCase()
      )?.position
    : undefined;
  const currentLeverage: PreflightLeverage | null = matchedPosition
    ? {
        value: matchedPosition.leverage.value,
        isCross: matchedPosition.leverage.type === 'cross',
      }
    : null;
  return {
    hyperliquidEnabled,
    referrerSet,
    builderFeeApproved,
    currentLeverage,
  };
}

export async function fetchPreflightState(
  input: PreflightFetchInput
): Promise<PreflightState> {
  const [userRole, referral, maxBuilderFee, clearinghouseState] =
    await Promise.all([
      perpUserRole({ address: input.address }),
      perpReferral({ address: input.address }),
      perpMaxBuilderFee({ address: input.address, builder: input.builder }),
      input.coin
        ? perpClearinghouseState({
            address: input.address,
            dexIdentifier: input.dexIdentifier,
          })
        : Promise.resolve(null),
    ]);
  return derivePreflightState(
    { userRole, referral, maxBuilderFee, clearinghouseState },
    { requiredMaxBuilderFee: input.requiredMaxBuilderFee, coin: input.coin }
  );
}

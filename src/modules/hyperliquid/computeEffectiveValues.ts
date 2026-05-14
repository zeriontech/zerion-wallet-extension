import type { PerpClearinghouseState } from './api/requests/perp-clearinghouse-state.types';
import type { SpotBalance } from './api/requests/spot-clearinghouse-state.types';
import type { AbstractionMode } from './api/requests/user-abstraction.types';
import { isUnifiedMode } from './api/requests/user-abstraction.types';

// USDC is `token: 0` in Hyperliquid spot.
const USDC_TOKEN_ID = 0;

function findUsdc(spotBalances: SpotBalance[] | null | undefined) {
  return spotBalances?.find((b) => b.token === USDC_TOKEN_ID) ?? null;
}

function toNumber(value: string | undefined | null): number {
  if (value == null) return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function sumPerpAccountValue(
  perpStates: Array<PerpClearinghouseState | null | undefined>
): number {
  let total = 0;
  for (const state of perpStates) {
    if (!state) continue;
    total += toNumber(state.marginSummary.accountValue);
  }
  return total;
}

function sumPerpWithdrawable(
  perpStates: Array<PerpClearinghouseState | null | undefined>
): number {
  let total = 0;
  for (const state of perpStates) {
    if (!state) continue;
    total += toNumber(state.withdrawable);
  }
  return total;
}

interface EffectiveValuesInput {
  perpStates: Array<PerpClearinghouseState | null | undefined>;
  spotBalances: SpotBalance[] | null | undefined;
  abstractionMode: AbstractionMode;
}

// In unified / portfolio-margin modes, USDC lives in spot and Hyperliquid
// auto-collateralises perps from it — `usdc.spot.total` is the live wallet
// equity (already reflects unrealized PnL via auto-margin adjustment).
// `marginSummary.accountValue` and per-perp-account `withdrawable` are
// unreliable (often zero) for these users, so we read from spot instead.
//
// For non-unified users we fall through to legacy values, which keeps the
// code path identical to before this change.
export function computeEffectiveAccountValueUSD(
  input: EffectiveValuesInput
): number {
  const { perpStates, spotBalances, abstractionMode } = input;
  if (isUnifiedMode(abstractionMode)) {
    const usdc = findUsdc(spotBalances);
    if (usdc) return toNumber(usdc.total);
    // Fall through to legacy if spot is transiently absent so a unified user
    // with open positions doesn't briefly render at $0 during a partial fetch.
  }
  return sumPerpAccountValue(perpStates);
}

export function computeEffectiveWithdrawableUSDC(
  input: EffectiveValuesInput
): number {
  const { perpStates, spotBalances, abstractionMode } = input;
  if (isUnifiedMode(abstractionMode)) {
    const usdc = findUsdc(spotBalances);
    if (usdc) {
      return Math.max(0, toNumber(usdc.total) - toNumber(usdc.hold));
    }
  }
  return sumPerpWithdrawable(perpStates);
}

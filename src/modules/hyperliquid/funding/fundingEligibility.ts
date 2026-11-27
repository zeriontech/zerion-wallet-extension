import type { HyperliquidSignatureSummary } from '../security/hyperliquidTypedData';
import { isOfficialHyperliquidOrigin } from '../security/hyperliquidTypedData';

export const FUNDING_PROMPT_COOLDOWN_MS = 1000 * 60 * 60 * 24 * 7;

export type FundingIneligibilityReason =
  | 'not_hyperliquid_origin'
  | 'not_approve_agent'
  | 'account_unavailable'
  | 'has_balance'
  | 'prompted_recently';

export type FundingEligibility =
  | { eligible: true }
  | { eligible: false; reason: FundingIneligibilityReason };

export interface FundingEligibilityInput {
  origin: string | null | undefined;
  signatureType: HyperliquidSignatureSummary['kind'] | null | undefined;
  /** `null` means the clearinghouse state could not be read. */
  withdrawable: number | null | undefined;
  lastPromptedAt: number | null | undefined;
  now: number;
}

export function isFundingPromptCoolingDown(
  lastPromptedAt: number | null | undefined,
  now: number,
): boolean {
  if (typeof lastPromptedAt !== 'number' || !Number.isFinite(lastPromptedAt)) {
    return false;
  }
  return now - lastPromptedAt < FUNDING_PROMPT_COOLDOWN_MS;
}

/**
 * The funding sheet is offered only right after an ApproveAgent ("enable
 * trading") signature on the official Hyperliquid origin, when the account has
 * nothing withdrawable yet.
 */
export function getFundingEligibility({
  origin,
  signatureType,
  withdrawable,
  lastPromptedAt,
  now,
}: FundingEligibilityInput): FundingEligibility {
  if (!isOfficialHyperliquidOrigin(origin)) {
    return { eligible: false, reason: 'not_hyperliquid_origin' };
  }
  if (signatureType !== 'approveAgent') {
    return { eligible: false, reason: 'not_approve_agent' };
  }
  if (withdrawable == null || !Number.isFinite(withdrawable)) {
    return { eligible: false, reason: 'account_unavailable' };
  }
  if (withdrawable > 0) {
    return { eligible: false, reason: 'has_balance' };
  }
  if (isFundingPromptCoolingDown(lastPromptedAt, now)) {
    return { eligible: false, reason: 'prompted_recently' };
  }
  return { eligible: true };
}

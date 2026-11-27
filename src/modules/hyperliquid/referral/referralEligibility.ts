import { normalizeAddress } from 'src/shared/normalizeAddress';
import { isOfficialHyperliquidOrigin } from '../security/hyperliquidTypedData';
import type { PerpReferral } from '../api/requests/perp-referral.types';
import type { PerpClearinghouseState } from '../api/requests/perp-clearinghouse-state.types';

export const REFERRAL_PROMPT_COOLDOWN_MS = 1000 * 60 * 60 * 24 * 7;
export const MAX_REFERRAL_CODE_LENGTH = 20;

export type ReferralIneligibilityReason =
  | 'not_hyperliquid_origin'
  | 'no_address'
  | 'cannot_sign_typed_data'
  | 'no_referral_code'
  | 'referral_unavailable'
  | 'already_referred'
  | 'account_unavailable'
  | 'account_not_funded'
  | 'prompted_recently';

export type ReferralEligibility =
  | { eligible: true; code: string }
  | { eligible: false; reason: ReferralIneligibilityReason };

export interface ReferralEligibilityInput {
  origin: string | null | undefined;
  address: string | null | undefined;
  /** The wallet is not a read-only/watch-only account. */
  canSignTypedData: boolean;
  referralCode: string | null | undefined;
  /** `null` means the info call failed, not "no referrer". */
  referral: PerpReferral | null | undefined;
  /** `null` means the info call failed. */
  clearinghouseState: PerpClearinghouseState | null | undefined;
  lastPromptedAt: number | null | undefined;
  now: number;
}

export function normalizeReferralCode(code: string | null | undefined): string | null {
  if (typeof code !== 'string') return null;
  const trimmed = code.trim();
  if (!trimmed || trimmed.length > MAX_REFERRAL_CODE_LENGTH) return null;
  return trimmed;
}

export function getHyperliquidAccountValue(
  state: PerpClearinghouseState | null | undefined,
): number | null {
  const raw = state?.marginSummary?.accountValue;
  if (raw == null || raw === '') return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

export function isReferralPromptCoolingDown(
  lastPromptedAt: number | null | undefined,
  now: number,
): boolean {
  if (typeof lastPromptedAt !== 'number' || !Number.isFinite(lastPromptedAt)) {
    return false;
  }
  // A future timestamp (clock skew or tampering) still counts as cooling down.
  return now - lastPromptedAt < REFERRAL_PROMPT_COOLDOWN_MS;
}

export function getReferralEligibility({
  origin,
  address,
  canSignTypedData,
  referralCode,
  referral,
  clearinghouseState,
  lastPromptedAt,
  now,
}: ReferralEligibilityInput): ReferralEligibility {
  if (!isOfficialHyperliquidOrigin(origin)) {
    return { eligible: false, reason: 'not_hyperliquid_origin' };
  }
  if (!address || !normalizeAddress(address)) {
    return { eligible: false, reason: 'no_address' };
  }
  if (!canSignTypedData) {
    return { eligible: false, reason: 'cannot_sign_typed_data' };
  }
  const code = normalizeReferralCode(referralCode);
  if (!code) {
    return { eligible: false, reason: 'no_referral_code' };
  }
  if (referral == null) {
    return { eligible: false, reason: 'referral_unavailable' };
  }
  if (referral.referredBy) {
    return { eligible: false, reason: 'already_referred' };
  }
  if (clearinghouseState == null) {
    return { eligible: false, reason: 'account_unavailable' };
  }
  const accountValue = getHyperliquidAccountValue(clearinghouseState);
  if (accountValue == null || accountValue <= 0) {
    return { eligible: false, reason: 'account_not_funded' };
  }
  if (isReferralPromptCoolingDown(lastPromptedAt, now)) {
    return { eligible: false, reason: 'prompted_recently' };
  }
  return { eligible: true, code };
}

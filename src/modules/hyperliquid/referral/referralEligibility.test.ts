import type { PerpReferral } from '../api/requests/perp-referral.types';
import type { PerpClearinghouseState } from '../api/requests/perp-clearinghouse-state.types';
import {
  getHyperliquidAccountValue,
  getReferralEligibility,
  isReferralPromptCoolingDown,
  normalizeReferralCode,
  REFERRAL_PROMPT_COOLDOWN_MS,
} from './referralEligibility';

const NOW = 1_800_000_000_000;
const ADDRESS = '0xc3A6672F5c9Ef31E5a086B1C80Ba1Ac73F95Cbb1';

function clearinghouse(accountValue: string | number): PerpClearinghouseState {
  return {
    marginSummary: {
      accountValue: String(accountValue),
      totalNtlPos: '0',
      totalRawUsd: '0',
      totalMarginUsed: '0',
    },
    crossMarginSummary: {
      accountValue: String(accountValue),
      totalNtlPos: '0',
      totalRawUsd: '0',
      totalMarginUsed: '0',
    },
    withdrawable: '0',
    assetPositions: [],
    time: NOW,
  };
}

function baseInput(overrides: Record<string, unknown> = {}) {
  return {
    origin: 'https://app.hyperliquid.xyz',
    address: ADDRESS,
    canSignTypedData: true,
    referralCode: 'ZERIONAPP',
    referral: { referredBy: null } as PerpReferral,
    clearinghouseState: clearinghouse('1'),
    lastPromptedAt: null as number | null,
    now: NOW,
    ...overrides,
  };
}

describe('referral eligibility', () => {
  test('offers the configured code to a funded, unreferred account', () => {
    expect(getReferralEligibility(baseInput())).toEqual({
      eligible: true,
      code: 'ZERIONAPP',
    });
  });

  test('requires the exact official origin', () => {
    for (const origin of [
      'https://app.hyperliquid.xyz.evil.test',
      'https://trade.app.hyperliquid.xyz',
      'http://app.hyperliquid.xyz',
      'https://hyperliquid.xyz',
      null,
    ]) {
      expect(getReferralEligibility(baseInput({ origin }))).toMatchObject({
        eligible: false,
        reason: 'not_hyperliquid_origin',
      });
    }
  });

  test('does not offer for read-only accounts', () => {
    expect(getReferralEligibility(baseInput({ canSignTypedData: false }))).toMatchObject({
      eligible: false,
      reason: 'cannot_sign_typed_data',
    });
  });

  test('requires a runtime referral code and never invents one', () => {
    for (const referralCode of [undefined, null, '', '   ', 'X'.repeat(21)]) {
      expect(getReferralEligibility(baseInput({ referralCode }))).toMatchObject({
        eligible: false,
        reason: 'no_referral_code',
      });
    }
  });

  test('does not offer when the referral status is unknown', () => {
    expect(getReferralEligibility(baseInput({ referral: null }))).toMatchObject({
      eligible: false,
      reason: 'referral_unavailable',
    });
  });

  test('does not offer to an account that already has a referrer', () => {
    expect(
      getReferralEligibility(
        baseInput({
          referral: { referredBy: { referrer: '0xreferrer', code: 'OTHER' } },
        }),
      ),
    ).toMatchObject({ eligible: false, reason: 'already_referred' });
  });

  test('requires a deposited account value', () => {
    expect(getReferralEligibility(baseInput({ clearinghouseState: null }))).toMatchObject({
      eligible: false,
      reason: 'account_unavailable',
    });
    for (const value of ['0', 0, '-1', '', 'not-a-number']) {
      expect(
        getReferralEligibility(baseInput({ clearinghouseState: clearinghouse(value) })),
      ).toMatchObject({ eligible: false, reason: 'account_not_funded' });
    }
  });

  test('suppresses the prompt for seven days per address', () => {
    expect(
      getReferralEligibility(baseInput({ lastPromptedAt: NOW - REFERRAL_PROMPT_COOLDOWN_MS + 1 })),
    ).toMatchObject({ eligible: false, reason: 'prompted_recently' });
    expect(
      getReferralEligibility(baseInput({ lastPromptedAt: NOW - REFERRAL_PROMPT_COOLDOWN_MS })),
    ).toMatchObject({ eligible: true });
    expect(getReferralEligibility(baseInput({ lastPromptedAt: NOW + 1000 }))).toMatchObject({
      eligible: false,
      reason: 'prompted_recently',
    });
  });

  test('normalizes the code but rejects missing values', () => {
    expect(normalizeReferralCode('  ZERIONAPP ')).toBe('ZERIONAPP');
    expect(normalizeReferralCode('')).toBeNull();
    expect(normalizeReferralCode(null)).toBeNull();
    expect(normalizeReferralCode('X'.repeat(21))).toBeNull();
  });

  test('account value parsing is strict', () => {
    expect(getHyperliquidAccountValue(clearinghouse('12.5'))).toBe(12.5);
    expect(getHyperliquidAccountValue(clearinghouse(''))).toBeNull();
    expect(getHyperliquidAccountValue(null)).toBeNull();
  });

  test('cooldown helper handles missing values', () => {
    expect(isReferralPromptCoolingDown(null, NOW)).toBe(false);
    expect(isReferralPromptCoolingDown(undefined, NOW)).toBe(false);
    expect(isReferralPromptCoolingDown(NOW, NOW)).toBe(true);
  });
});

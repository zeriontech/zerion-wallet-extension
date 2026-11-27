import { FUNDING_PROMPT_COOLDOWN_MS, getFundingEligibility } from './fundingEligibility';

const NOW = 1_800_000_000_000;

function input(overrides: Record<string, unknown> = {}) {
  return {
    origin: 'https://app.hyperliquid.xyz',
    signatureType: 'approveAgent' as const,
    withdrawable: 0,
    lastPromptedAt: null as number | null,
    now: NOW,
    ...overrides,
  };
}

describe('funding eligibility', () => {
  test('offers funding after Enable trading on the official origin with $0 withdrawable', () => {
    expect(getFundingEligibility(input())).toEqual({ eligible: true });
  });

  test('requires the exact official origin and an ApproveAgent signature', () => {
    expect(
      getFundingEligibility(input({ origin: 'https://app.hyperliquid.xyz.evil.test' })),
    ).toEqual({ eligible: false, reason: 'not_hyperliquid_origin' });
    expect(getFundingEligibility(input({ signatureType: 'approveBuilderFee' }))).toEqual({
      eligible: false,
      reason: 'not_approve_agent',
    });
    expect(getFundingEligibility(input({ signatureType: null }))).toEqual({
      eligible: false,
      reason: 'not_approve_agent',
    });
  });

  test('requires a readable zero balance', () => {
    expect(getFundingEligibility(input({ withdrawable: null }))).toEqual({
      eligible: false,
      reason: 'account_unavailable',
    });
    expect(getFundingEligibility(input({ withdrawable: Number.NaN }))).toEqual({
      eligible: false,
      reason: 'account_unavailable',
    });
    expect(getFundingEligibility(input({ withdrawable: 0.01 }))).toEqual({
      eligible: false,
      reason: 'has_balance',
    });
    expect(getFundingEligibility(input({ withdrawable: -1 }))).toEqual({ eligible: true });
  });

  test('prompts at most once per week per address', () => {
    expect(
      getFundingEligibility(input({ lastPromptedAt: NOW - FUNDING_PROMPT_COOLDOWN_MS + 1 })),
    ).toEqual({ eligible: false, reason: 'prompted_recently' });
    expect(
      getFundingEligibility(input({ lastPromptedAt: NOW - FUNDING_PROMPT_COOLDOWN_MS })),
    ).toEqual({ eligible: true });
    expect(getFundingEligibility(input({ lastPromptedAt: NOW + 1 }))).toEqual({
      eligible: false,
      reason: 'prompted_recently',
    });
  });
});

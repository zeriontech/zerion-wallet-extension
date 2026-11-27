import { buildSetReferrerAction } from '../actions/buildSetReferrerAction';
import { signAndSubmit, type SignAndSubmitDeps } from '../useCases/signAndSubmit';
import type { ExchangeResponse } from '../api/submitExchangeAction.types';
import { normalizeReferralCode } from './referralEligibility';

export async function applyHyperliquidReferralCode({
  code,
  signTypedData,
  submit,
  now = Date.now,
}: {
  code: string;
  now?: () => number;
} & SignAndSubmitDeps): Promise<ExchangeResponse> {
  const normalizedCode = normalizeReferralCode(code);
  if (!normalizedCode) {
    throw new Error('A valid Hyperliquid referral code is required');
  }
  return signAndSubmit(
    {
      action: buildSetReferrerAction({ code: normalizedCode }),
      nonce: now(),
    },
    { signTypedData, submit },
  );
}

import { normalizeAddress } from 'src/shared/normalizeAddress';
import { perpReferral } from 'src/modules/hyperliquid/api/requests/perp-referral.client';

const CACHE_TTL_MS = 1000 * 60 * 60 * 12;
const cache = new Map<string, { referred: boolean; code: string | null; checkedAt: number }>();

/**
 * Stores the Hyperliquid `referredBy` status as a Mixpanel user property for
 * extension users seen on app.hyperliquid.xyz. Never throws and never blocks
 * the signing event.
 */
export async function reportHyperliquidReferralStatus({
  address,
  setUserProperties,
  now = Date.now,
}: {
  address: string;
  setUserProperties: (properties: Record<string, unknown>) => Promise<unknown>;
  now?: () => number;
}): Promise<void> {
  const key = normalizeAddress(address);
  const cached = cache.get(key);
  if (cached && now() - cached.checkedAt < CACHE_TTL_MS) {
    return;
  }
  try {
    const referral = await perpReferral({ address });
    // A failed info call must not report the user as unreferred.
    if (referral == null) return;
    const referred = Boolean(referral.referredBy);
    const code = referral.referredBy?.code ?? null;
    cache.set(key, { referred, code, checkedAt: now() });
    await setUserProperties({
      hyperliquid_referred: referred,
      hyperliquid_referrer_code: code,
    });
  } catch {
    // Metrics must never affect signing.
  }
}

/**
 * Whether the browser can offer Apple Pay as an on-ramp payment method.
 *
 * `deposit/quotes/v1` takes `supportsApplePay` and, when true, adds Apple Pay to
 * each provider's `supportedPaymentMethods` — so getting this wrong either
 * advertises a method that cannot be used, or hides one that can.
 *
 * Two deliberate departures from the web app's version:
 *
 * 1. **It cannot throw.** The web app awaits its probe *inside* the quote
 *    `queryFn` with no `try`/`catch`. `PaymentRequest` construction throws on an
 *    insecure or disallowed context, and an extension page is neither plain
 *    `https` nor a context Chrome has historically allowed the Apple Pay method
 *    in — so a throw there would fail the whole quote query, not just the probe.
 * 2. **It does not depend on the amount.** The web app memoizes on
 *    `(currency, value)`, but `canMakePayment()` answers whether the *method* is
 *    available, not whether a particular total is payable. A fixed probe total
 *    means one call per session and keeps the answer out of the quote key.
 */
async function probe(): Promise<boolean> {
  try {
    if (typeof PaymentRequest === 'undefined') {
      return false;
    }
    const request = new PaymentRequest(
      [{ supportedMethods: 'https://apple.com/apple-pay' }],
      { total: { label: 'Total', amount: { currency: 'USD', value: '1.00' } } }
    );
    return await request.canMakePayment();
  } catch {
    return false;
  }
}

let cached: Promise<boolean> | null = null;

export function isApplePaySupported(): Promise<boolean> {
  if (!cached) {
    cached = probe();
  }
  return cached;
}

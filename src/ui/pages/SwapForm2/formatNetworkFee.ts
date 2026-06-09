import BigNumber from 'bignumber.js';
import { formatCurrencyValueExtra } from 'src/shared/units/formatCurrencyValue';
import { formatTokenValue } from 'src/shared/units/formatTokenValue';
import { noValueDash } from 'src/ui/shared/typography';
import type { NetworkFeeQuote } from './getNetworkFeeForSpeed';

/**
 * Formats the quote's network fee, scaled by `ratio` (the effective-gas-price
 * multiplier). `ratio` defaults to `1` (the quote's own, "fast", price). Used
 * both for the displayed fee and for the per-speed prices in the type selector.
 */
export function formatNetworkFee(quote: NetworkFeeQuote, ratio = 1): string {
  const { networkFee } = quote;
  if (networkFee?.free) {
    return 'Free';
  }
  if (networkFee?.amount?.value != null) {
    return formatCurrencyValueExtra(
      networkFee.amount.value * ratio,
      'en',
      networkFee.amount.currency,
      { zeroRoundingFallback: 0.01 }
    );
  }
  if (networkFee?.amount?.quantity) {
    const quantity =
      ratio === 1
        ? networkFee.amount.quantity
        : new BigNumber(networkFee.amount.quantity)
            .multipliedBy(ratio)
            .toFixed();
    return formatTokenValue(quantity, networkFee.fungible?.symbol ?? '');
  }
  return noValueDash;
}

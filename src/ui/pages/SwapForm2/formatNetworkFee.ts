import BigNumber from 'bignumber.js';
import { formatCurrencyValueExtra } from 'src/shared/units/formatCurrencyValue';
import { formatTokenValue } from 'src/shared/units/formatTokenValue';
import { noValueDash } from 'src/shared/typography';
import type { NetworkFeeQuote } from './getNetworkFeeForSpeed';

export interface NetworkFeeFormatFallbacks {
  /** Unscaled fiat value of the quote's original fee, used when `amount.value` is null. */
  fallbackFiatValue?: number | null;
  /** Symbol used when the quote has no `fungible.symbol`. */
  fallbackSymbol?: string | null;
  /** Currency for `fallbackFiatValue` when the quote has no `amount.currency`. */
  currency?: string | null;
}

/**
 * Formats the quote's network fee, scaled by `ratio` (the effective-gas-price
 * multiplier). `ratio` defaults to `1` (the quote's own, "fast", price). Used
 * both for the displayed fee and for the per-speed prices in the type selector.
 *
 * The fallbacks are supplied by both the row and the picker so a quote without
 * `amount.value` cannot show fiat in one place and a token quantity in another.
 */
export function formatNetworkFee(
  quote: NetworkFeeQuote,
  ratio = 1,
  {
    fallbackFiatValue = null,
    fallbackSymbol = null,
    currency = null,
  }: NetworkFeeFormatFallbacks = {},
): string {
  const { networkFee } = quote;
  if (networkFee?.free) {
    return 'Free';
  }
  if (networkFee?.amount?.value != null) {
    return formatCurrencyValueExtra(
      networkFee.amount.value * ratio,
      'en',
      networkFee.amount.currency,
      { zeroRoundingFallback: 0.01 },
    );
  }
  const fiatCurrency = currency ?? networkFee?.amount?.currency;
  if (fallbackFiatValue != null && fiatCurrency) {
    return formatCurrencyValueExtra(fallbackFiatValue * ratio, 'en', fiatCurrency, {
      zeroRoundingFallback: 0.01,
    });
  }
  if (networkFee?.amount?.quantity) {
    const quantity =
      ratio === 1
        ? networkFee.amount.quantity
        : new BigNumber(networkFee.amount.quantity).multipliedBy(ratio).toFixed();
    return formatTokenValue(quantity, networkFee.fungible?.symbol ?? fallbackSymbol ?? '');
  }
  return noValueDash;
}

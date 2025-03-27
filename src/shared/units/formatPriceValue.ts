import BigNumber from 'bignumber.js';
import memoize from 'memoize-one';
import type { CurrencyConfig } from 'src/modules/currency/currencies';
import { CURRENCIES, resolveOptions } from 'src/modules/currency/currencies';
import { minus as typographicMinus } from 'src/ui/shared/typography';

const getCurrencyFormatter = memoize((locale, currency, config = {}) => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    ...config,
  });
});

const getSmallPriceCurrencyFormatter = memoize(
  (locale, currency, config = {}) => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumSignificantDigits: 3,
      maximumFractionDigits: 20,
      ...config,
    });
  }
);

// ~1$ values should be formatted as regular currency values
const SMALL_VALUE_THRESHOLD = 0.99;

export function formatPriceValue(
  value: BigNumber.Value,
  locale: string,
  currency: string,
  opts: Intl.NumberFormatOptions | null = null
) {
  const number = value instanceof BigNumber ? value.toNumber() : Number(value);
  const sign = number < 0 ? typographicMinus : '';
  const absValue = Math.abs(number);
  const isSmallValue = absValue < SMALL_VALUE_THRESHOLD;

  const config = CURRENCIES[currency] as CurrencyConfig | undefined;
  const numberFormatOptions = resolveOptions(number, config || null, opts);
  const formatter = isSmallValue
    ? getSmallPriceCurrencyFormatter(locale, currency, numberFormatOptions)
    : getCurrencyFormatter(locale, currency, numberFormatOptions);

  const modifyParts = config?.modifyParts;
  if (modifyParts) {
    const parts = formatter.formatToParts(absValue);
    return `${sign}${modifyParts(parts)
      .map((part) => part.value)
      .join('')}`;
  }
  return `${sign}${formatter.format(absValue)}`;
}

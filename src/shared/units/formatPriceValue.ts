import BigNumber from 'bignumber.js';
import memoize from 'memoize-one';
import type { CurrencyConfig } from 'src/modules/currency/currencies';
import { CURRENCIES, resolveOptions } from 'src/modules/currency/currencies';
import { minus as typographicMinus } from 'src/ui/shared/typography';
import {
  countLeadingZeros,
  formatSubscriptValue,
} from './formatSubscriptValue';

const PRICE_SIGNIFICANT_DIGITS = 4;
// Switch to the subscript short form once there are this many zeros right
// after the decimal point (i.e. values smaller than ~0.00000001).
const SUBSCRIPT_ZERO_THRESHOLD = 8;

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
      maximumSignificantDigits: PRICE_SIGNIFICANT_DIGITS,
      maximumFractionDigits: 20,
      ...config,
    });
  }
);

// ~1$ values should be formatted as regular currency values
const SMALL_VALUE_THRESHOLD = 0.99;

/**
 * Some V8 engines ignore `minimumFractionDigits` when
 * `maximumSignificantDigits` is set, so we pad the fraction to at least 2
 * digits ourselves (e.g. `$0.5` -> `$0.50`, `0,5 €` -> `0,50 €`). Locale-aware:
 * the fraction separator is taken from the formatter so comma locales work too.
 */
function padMinFraction(
  formatted: string,
  minFraction: number,
  formatter: Intl.NumberFormat
) {
  const decimalPart = formatter
    .formatToParts(1.1)
    .find((part) => part.type === 'decimal');
  const separator = decimalPart?.value;
  if (!separator) {
    return formatted;
  }
  // Find the last group of digits that follows the decimal separator.
  const index = formatted.lastIndexOf(separator);
  if (index === -1) {
    return formatted;
  }
  const fracMatch = formatted.slice(index + separator.length).match(/^(\d+)/);
  const fracLength = fracMatch ? fracMatch[1].length : 0;
  if (fracLength >= minFraction) {
    return formatted;
  }
  const insertAt = index + separator.length + fracLength;
  return `${formatted.slice(0, insertAt)}${'0'.repeat(
    minFraction - fracLength
  )}${formatted.slice(insertAt)}`;
}

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

  // Very tiny prices use the subscript short form, e.g. 0.0000000012 -> $0.0₈12
  if (absValue > 0 && countLeadingZeros(absValue) >= SUBSCRIPT_ZERO_THRESHOLD) {
    return `${sign}${formatSubscriptValue(
      absValue,
      locale,
      currency,
      PRICE_SIGNIFICANT_DIGITS
    )}`;
  }

  const config = CURRENCIES[currency] as CurrencyConfig | undefined;
  const numberFormatOptions = resolveOptions(number, config || null, opts);
  const formatter = isSmallValue
    ? getSmallPriceCurrencyFormatter(locale, currency, numberFormatOptions)
    : getCurrencyFormatter(locale, currency, numberFormatOptions);

  const minFraction = isSmallValue ? 2 : 0;
  const modifyParts = config?.modifyParts;
  if (modifyParts) {
    const parts = formatter.formatToParts(absValue);
    return `${sign}${padMinFraction(
      modifyParts(parts)
        .map((part) => part.value)
        .join(''),
      minFraction,
      formatter
    )}`;
  }
  return `${sign}${padMinFraction(
    formatter.format(absValue),
    minFraction,
    formatter
  )}`;
}

export function formatPriceValueToParts(
  value: BigNumber.Value,
  locale: string,
  currency: string,
  opts: Intl.NumberFormatOptions | null = null
) {
  const number = value instanceof BigNumber ? value.toNumber() : Number(value);
  const absValue = Math.abs(number);
  const isSmallValue = absValue < SMALL_VALUE_THRESHOLD;

  const config = CURRENCIES[currency] as CurrencyConfig | undefined;
  const numberFormatOptions = resolveOptions(number, config || null, opts);
  const formatter = isSmallValue
    ? getSmallPriceCurrencyFormatter(locale, currency, numberFormatOptions)
    : getCurrencyFormatter(locale, currency, numberFormatOptions);

  const parts = formatter.formatToParts(number);
  const modifyParts = config?.modifyParts;
  return modifyParts ? modifyParts(parts) : parts;
}

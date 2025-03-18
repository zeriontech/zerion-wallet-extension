import BigNumber from 'bignumber.js';
import memoize from 'memoize-one';
import type { CurrencyConfig } from 'src/modules/currency/currencies';
import { CURRENCIES, resolveOptions } from 'src/modules/currency/currencies';
import { minus as typographicMinus } from 'src/ui/shared/typography';

const getCurrencyFormatter = memoize((locale, currency, config = {}) => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
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

export function formatCurrencyValue(
  value: BigNumber.Value,
  locale: string,
  currency: string,
  opts: Intl.NumberFormatOptions | null = null
) {
  const number = value instanceof BigNumber ? value.toNumber() : Number(value);
  const sign = number < 0 ? typographicMinus : '';
  const absValue = Math.abs(number);
  const isSmallValue = absValue < 1;

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

export function formatCurrencyToParts(
  value: BigNumber.Value,
  locale: string,
  currency: string,
  opts: Intl.NumberFormatOptions | null = null
) {
  const number = value instanceof BigNumber ? value.toNumber() : Number(value);
  const config = CURRENCIES[currency] as CurrencyConfig | undefined;
  const numberFormatOptions = resolveOptions(number, config || null, opts);
  const formatter = getCurrencyFormatter(locale, currency, numberFormatOptions);
  const parts = formatter.formatToParts(number);
  const modifyParts = CURRENCIES[currency]?.modifyParts;
  return modifyParts ? modifyParts(parts) : parts;
}

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

export function formatCurrencyValue(
  value: BigNumber.Value,
  locale: string,
  currency: string
) {
  const valueAsNumber =
    value instanceof BigNumber ? value.toNumber() : Number(value);
  const sign = valueAsNumber < 0 ? typographicMinus : '';
  const absValue = Math.abs(valueAsNumber);

  const config = CURRENCIES[currency] as CurrencyConfig | undefined;
  const numberFormatOptions = resolveOptions(valueAsNumber, config || null);
  const formatter = getCurrencyFormatter(locale, currency, numberFormatOptions);

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
  currency: string
) {
  const valueAsNumber =
    value instanceof BigNumber ? value.toNumber() : Number(value);
  const config = CURRENCIES[currency] as CurrencyConfig | undefined;
  const numberFormatOptions = resolveOptions(valueAsNumber, config || null);
  const formatter = getCurrencyFormatter(locale, currency, numberFormatOptions);
  const parts = formatter.formatToParts(valueAsNumber);
  const modifyParts = CURRENCIES[currency]?.modifyParts;
  return modifyParts ? modifyParts(parts) : parts;
}

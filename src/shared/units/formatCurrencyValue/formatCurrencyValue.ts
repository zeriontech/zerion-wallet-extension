import BigNumber from 'bignumber.js';
import memoize from 'memoize-one';
import { CURRENCIES, FORMATTER_CONFIG } from 'src/modules/currency/currencies';
import { minus } from 'src/ui/shared/typography';

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
  const formatter = getCurrencyFormatter(
    locale,
    currency,
    FORMATTER_CONFIG[currency]?.(value)
  );
  const valueAsNumber =
    value instanceof BigNumber ? value.toNumber() : Number(value);
  const sign = valueAsNumber < 0 ? minus : '';
  const absValue = Math.abs(valueAsNumber);

  const modifyParts = CURRENCIES[currency]?.modifyParts;
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
  const formatter = getCurrencyFormatter(
    locale,
    currency,
    FORMATTER_CONFIG[currency]?.(value)
  );
  const parts = formatter.formatToParts(
    value instanceof BigNumber ? value.toNumber() : Number(value)
  );
  const modifyParts = CURRENCIES[currency]?.modifyParts;
  return modifyParts ? modifyParts(parts) : parts;
}

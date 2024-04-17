import BigNumber from 'bignumber.js';
import memoize from 'memoize-one';
import { CURRENCIES } from 'src/modules/currency/currencies';
import { minus } from 'src/ui/shared/typography';

const getDefaultFormatter = memoize((locale, currency) => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  });
});

const getCurrencyFormatter = memoize((locale, currency, config) => {
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
  const currencyConfig = CURRENCIES[currency];
  const formatter =
    currencyConfig && currencyConfig.getFormatterConfig
      ? getCurrencyFormatter(
          locale,
          currency,
          currencyConfig.getFormatterConfig(value)
        )
      : getDefaultFormatter(locale, currency);
  const valueAsNumber =
    value instanceof BigNumber ? value.toNumber() : Number(value);
  const sign = valueAsNumber < 0 ? minus : '';
  const absValue = Math.abs(valueAsNumber);

  if (currencyConfig && currencyConfig.modifyParts && formatter.formatToParts) {
    const parts = formatter.formatToParts(absValue);
    return `${sign}${currencyConfig
      .modifyParts(parts)
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
  const currencyConfig = CURRENCIES[currency];
  const formatter =
    currencyConfig && currencyConfig.getFormatterConfig
      ? getCurrencyFormatter(
          locale,
          currency,
          currencyConfig.getFormatterConfig(value)
        )
      : getDefaultFormatter(locale, currency);

  const parts = formatter.formatToParts(
    value instanceof BigNumber ? value.toNumber() : Number(value)
  );
  return currencyConfig.modifyParts ? currencyConfig.modifyParts(parts) : parts;
}

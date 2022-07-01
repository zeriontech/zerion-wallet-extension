import BigNumber from 'bignumber.js';
import memoize from 'memoize-one';

const getDefaultFormatter = memoize((locale, currency) => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  });
});

export function formatCurrencyValue(
  value: BigNumber.Value,
  locale: string,
  currency: string
) {
  const formatter = getDefaultFormatter(locale, currency);
  return formatter.format(
    value instanceof BigNumber ? value.toNumber() : Number(value)
  );
}

export function formatCurrencyToParts(
  value: BigNumber.Value,
  locale: string,
  currency: string
) {
  const formatter = getDefaultFormatter(locale, currency);
  return formatter.formatToParts(
    value instanceof BigNumber ? value.toNumber() : Number(value)
  );
}

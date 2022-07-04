import BigNumber from 'bignumber.js';
import memoize from 'memoize-one';
import { minus } from 'src/ui/shared/typography';

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
  const valueAsNumber =
    value instanceof BigNumber ? value.toNumber() : Number(value);
  const sign = valueAsNumber < 0 ? minus : '';
  return `${sign}${formatter.format(Math.abs(valueAsNumber))}`;
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

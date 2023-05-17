import memoize from 'memoize-one';
import type BigNumber from 'bignumber.js';
import { minus } from 'src/ui/shared/typography';
import { toNumber } from '../toNumber';

const getFormatterOneDigit = memoize(
  (locale: string) =>
    new Intl.NumberFormat(locale, { maximumFractionDigits: 1 })
);
const getFormatterTwoDigits = memoize(
  (locale: string) =>
    new Intl.NumberFormat(locale, { maximumFractionDigits: 2 })
);

export function formatPercent(value: BigNumber.Value, locale: string) {
  const valueAsNumber = toNumber(value);
  const formatter =
    valueAsNumber < 1
      ? getFormatterTwoDigits(locale)
      : getFormatterOneDigit(locale);
  const sign = valueAsNumber < 0 ? minus : '';
  return `${sign}${formatter.format(Math.abs(valueAsNumber))}`;
}

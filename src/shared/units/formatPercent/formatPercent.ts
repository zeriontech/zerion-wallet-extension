import memoize from 'memoize-one';
import type BigNumber from 'bignumber.js';
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
  const formatter =
    value < 1 ? getFormatterTwoDigits(locale) : getFormatterOneDigit(locale);
  return formatter.format(toNumber(value));
}

import memoize from 'memoize-one';
import type BigNumber from 'bignumber.js';
import { minus } from 'src/ui/shared/typography';
import { toNumber } from './toNumber';

const getFormatter = memoize(
  (locale, maximumFractionDigits, minimumFractionDigits = 0) => {
    return Intl.NumberFormat(locale, {
      maximumFractionDigits,
      minimumFractionDigits,
    });
  }
);

export function formatPercent(
  value: BigNumber.Value,
  locale: string,
  options?: { maximumFractionDigits?: number; minimumFractionDigits?: number }
) {
  const valueAsNumber = toNumber(value);
  const formatter = getFormatter(
    locale,
    options?.maximumFractionDigits ?? (valueAsNumber < 1 ? 2 : 1),
    options?.minimumFractionDigits
  );
  const sign = valueAsNumber < 0 ? minus : '';
  return `${sign}${formatter.format(Math.abs(valueAsNumber))}`;
}

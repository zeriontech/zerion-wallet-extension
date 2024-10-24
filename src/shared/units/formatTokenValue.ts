import { BigNumber } from 'bignumber.js';
import memoize from 'lodash/memoize';
import { NBSP } from '../../ui/shared/typography';

const tokenValueFormatters = {
  default: new Intl.NumberFormat('en', {
    useGrouping: false,
    maximumFractionDigits: 3,
  }),
  '<0.1': new Intl.NumberFormat('en', { maximumSignificantDigits: 2 }),
};

export function roundTokenValue(value: BigNumber.Value) {
  const number = value instanceof BigNumber ? value.toNumber() : Number(value);
  const formatter =
    Math.abs(number) < 0.1
      ? tokenValueFormatters['<0.1']
      : tokenValueFormatters.default;
  return formatter.format(number);
}

const getDefaultFormatter = memoize((notation?: 'compact') => {
  return new Intl.NumberFormat('en', {
    maximumFractionDigits: notation === 'compact' ? 1 : 20,
    notation,
  });
});

export function formatTokenValue(
  value: BigNumber.Value,
  symbol?: string,
  { notation }: { notation?: 'compact' } = {}
) {
  const roundedString = roundTokenValue(value);
  const formatter = getDefaultFormatter(notation);
  const result = formatter.format(Number(roundedString));
  return symbol ? `${result}${NBSP}${symbol}` : result;
}

import { BigNumber } from 'bignumber.js';
import memoize from 'lodash/memoize';
import { NBSP } from '../../ui/shared/typography';

function countFractionalZeros(value: string) {
  return value.match(/\.(0+)[1-9]/)?.[1].length ?? 0;
}

export function roundTokenValue(rawValue: BigNumber.Value) {
  const value = new BigNumber(rawValue);
  const fractionalZerosCount = countFractionalZeros(value.toFixed());
  return value
    .decimalPlaces(
      fractionalZerosCount > 6 && value.absoluteValue().isGreaterThan(1)
        ? 0
        : fractionalZerosCount > 0
        ? fractionalZerosCount + 2
        : 3
    )
    .toFixed();
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

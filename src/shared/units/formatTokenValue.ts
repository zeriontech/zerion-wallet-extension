import { BigNumber } from 'bignumber.js';
import { NBSP } from 'src/ui/shared/typography';

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

const formatter = new Intl.NumberFormat('en', {
  maximumFractionDigits: 20,
});

export function formatTokenValue(value: BigNumber.Value, symbol?: string) {
  const roundedString = roundTokenValue(value);
  const result = formatter.format(Number(roundedString));
  return symbol ? `${result}${NBSP}${symbol}` : result;
}

import memoize from 'memoize-one';
import type { CurrencyConfig } from 'src/modules/currency/currencies';
import { CURRENCIES } from 'src/modules/currency/currencies';

/**
 * Subscript short form for very tiny prices (USD formatting PRD — Style 2).
 *
 * Read `$0.0₈12` as: zero, dot, then 8 zeros, then 12 -> 0.0000000012.
 * - The subscript counts the zeros right after the decimal point.
 * - The digits after it are the first `significantDigits` significant digits,
 *   with trailing zeros removed.
 *
 * Subscript is `price` only and is never used for `amount`.
 */

const SUBSCRIPT_DIGITS = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉'];
const toSubscript = (n: number) =>
  String(n)
    .split('')
    .map((d) => SUBSCRIPT_DIGITS[Number(d)])
    .join('');

const getZeroFormatter = memoize((locale, currency) => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
});

/** Count of zeros between the decimal point and the first significant digit. */
export function countLeadingZeros(absValue: number) {
  return -Math.floor(Math.log10(absValue)) - 1;
}

export function formatSubscriptValue(
  absValue: number,
  locale: string,
  currency: string,
  significantDigits: number
) {
  const exponent = Math.floor(Math.log10(absValue));
  const leadingZeros = -exponent - 1;
  const significand = absValue / 10 ** exponent;
  const digits = significand
    .toPrecision(significantDigits)
    .replace('.', '')
    .replace(/0+$/, '');

  // Build from the currency's own `$0.00` rendering so the symbol, its
  // position and the decimal separator all come from Intl.
  const config = CURRENCIES[currency] as CurrencyConfig | undefined;
  const formatter = getZeroFormatter(locale, currency);
  const modifyParts = config?.modifyParts;
  const zero = modifyParts
    ? modifyParts(formatter.formatToParts(0))
        .map((part) => part.value)
        .join('')
    : formatter.format(0); // e.g. "$0.00"

  const separatorMatch = zero.match(/0(\D)\d/);
  const separator = separatorMatch ? separatorMatch[1] : '.';
  // Replace the "0.00" fraction part with "0<separator>0<subscript><digits>".
  return zero.replace(
    /0\D\d+/,
    `0${separator}0${toSubscript(leadingZeros)}${digits}`
  );
}

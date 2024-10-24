import { BigNumber } from 'bignumber.js';
import { formatCurrencyValue } from './formatCurrencyValue';

const toNumber = (v: BigNumber.Value) =>
  v instanceof BigNumber ? v.toNumber() : Number(v);

function adjustRoundingFallback(fallbackValue: number, value: number) {
  let adjusted = fallbackValue;
  // Multiply fallbackValue by 10 until it's larger than value
  while (Math.abs(value) >= adjusted && adjusted < 10) {
    adjusted *= 10;
  }
  return adjusted;
}

/** What's a good name for this? */
export function formatCurrencyValueExtra(
  value: BigNumber.Value,
  locale: string,
  currency: string,
  {
    zeroRoundingFallback,
  }: {
    /**
     * Example: output near-zero values as <$0.01
     * When provided, this value will be used in the "less than"
     * representation, e.g. if zeroRoundingFallback: 0.004,
     * output will be formatted as `<$0.04` (according to locale and currency options)
     * It will be used ONLY is the original value gets rounded to zero
     * If the original value is less than zeroRoundingFallback, but not rounded to zero,
     * zeroRoundingFallback notation will NOT be used
     */
    zeroRoundingFallback?: number;
  } = {}
) {
  const formattedValue = formatCurrencyValue(value, locale, currency);
  if (zeroRoundingFallback) {
    const formattedZero = formatCurrencyValue(0, locale, currency);
    if (formattedValue === formattedZero && !new BigNumber(value).isZero()) {
      const adjusted = adjustRoundingFallback(
        zeroRoundingFallback,
        toNumber(value)
      );
      return `<${formatCurrencyValue(adjusted, locale, currency, {
        // provided zeroRoundingFallback should be displayed as is
        minimumFractionDigits: 0,
        maximumFractionDigits: 20,
      })}`;
    }
  }
  return formattedValue;
}

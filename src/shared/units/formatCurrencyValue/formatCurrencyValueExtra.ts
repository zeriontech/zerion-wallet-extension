import { BigNumber } from 'bignumber.js';
import { formatCurrencyValue } from './formatCurrencyValue';

const toNumber = (v: BigNumber.Value) =>
  v instanceof BigNumber ? v.toNumber() : Number(v);

function adjustMinDisplayValue(minDisplayValue: number, value: number) {
  let adjusted = minDisplayValue;
  // Multiply minDisplayValue by 10 until it's larger than value
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
    minDisplayValue,
  }: {
    /**
     * Example: output near-zero values as <$0.01
     * When provided, this value will be used in the "less than"
     * representation, e.g. if minDisplayValue: 0.004,
     * output will be formatted as `<$0.04` (according to locale and currency options)
     * It will be used ONLY is the original value gets rounded to zero
     * If the original value is less than minDisplayValue, but not rounded to zero,
     * minDisplayValue notation will NOT be used
     */
    minDisplayValue?: number;
  } = {}
) {
  const formattedValue = formatCurrencyValue(value, locale, currency);
  if (minDisplayValue) {
    const formattedZero = formatCurrencyValue(0, locale, currency);
    if (formattedValue === formattedZero && !new BigNumber(value).isZero()) {
      const adjusted = adjustMinDisplayValue(minDisplayValue, toNumber(value));
      return `<${formatCurrencyValue(adjusted, locale, currency, {
        // provided minDisplayValue should be displayed as is
        minimumFractionDigits: 0,
        maximumFractionDigits: 20,
      })}`;
    }
  }
  return formattedValue;
}

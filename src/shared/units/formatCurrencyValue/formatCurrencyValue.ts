import BigNumber from 'bignumber.js';
import memoize from 'memoize-one';
import type { CurrencyConfig } from 'src/modules/currency/currencies';
import { CURRENCIES, resolveOptions } from 'src/modules/currency/currencies';
import { minus as typographicMinus } from 'src/ui/shared/typography';

/**
 * USD formatting — Style 1 ("amount"): money the user has or pays.
 *
 * This is the shared currency formatter, so the amount rule is applied only to
 * plain fiat currencies that don't pin their own fraction digits (usd, eur,
 * gbp, …). Currencies that set fraction options (eth/btc quantities, the
 * whole-unit krw/jpy/idr/ngn) and any call passing explicit `opts` keep their
 * existing behavior — the PRD leaves token quantities out of scope.
 *
 * Amount rule (see USD formatting PRD):
 * - 1 significant digit below 1, with a floor of 0.001 — any non-zero amount
 *   below 0.001 shows as 0.001.
 * - Once the value is >= 0.01, show at least 2 decimals.
 * - The whole-dollar part is always shown in full (>= 1 -> full number, 2 decimals).
 * - 0 -> "$0".
 * - Negative: sign goes before the symbol, e.g. -$1.23.
 * - NaN / missing data -> "–" (en dash).
 */

const AMOUNT_FLOOR = 0.001;
const NA_DASH = '–'; // en dash, shown for NaN / missing data

const getCurrencyFormatter = memoize((locale, currency, config = {}) => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    ...config,
  });
});

/** Round a positive number to a single significant digit. */
function roundToOneSignificantDigit(value: number) {
  const power = Math.ceil(Math.log10(value)) - 1;
  const factor = 10 ** power;
  const rounded = Math.round(value / factor) * factor;
  // `factor` is fractional for values < 1 (e.g. 0.1, 0.001), so `rounded`
  // inherits binary float noise — 0.30000000000000004 stays 0.30000000000000004
  // and the maximumFractionDigits: 20 formatter would print every junk digit.
  // Snap back to the known decimal place (−power decimals when power < 0).
  return power < 0 ? Number(rounded.toFixed(-power)) : rounded;
}

/**
 * The amount rule only applies to plain fiat currencies. A currency that pins
 * its own fraction/significant digits (eth/btc, krw/jpy/idr/ngn) or any call
 * passing runtime `opts` opts out and keeps the existing formatting.
 */
function shouldApplyAmountRule(
  resolvedOptions: Intl.NumberFormatOptions | null
) {
  if (!resolvedOptions) {
    return true;
  }
  return (
    resolvedOptions.minimumFractionDigits == null &&
    resolvedOptions.maximumFractionDigits == null &&
    resolvedOptions.maximumSignificantDigits == null &&
    resolvedOptions.minimumSignificantDigits == null
  );
}

export function formatCurrencyValue(
  value: BigNumber.Value,
  locale: string,
  currency: string,
  opts: Intl.NumberFormatOptions | null = null
) {
  const number = value instanceof BigNumber ? value.toNumber() : Number(value);
  if (Number.isNaN(number)) {
    return NA_DASH;
  }
  const sign = number < 0 ? typographicMinus : '';
  const absValue = Math.abs(number);

  const config = CURRENCIES[currency] as CurrencyConfig | undefined;
  const numberFormatOptions = resolveOptions(number, config || null, opts);

  const applyAmountRule =
    opts == null && shouldApplyAmountRule(numberFormatOptions);

  // Amount rule for plain fiat currencies: keep at least 2 decimals, and below
  // 1 round to a single significant digit with a 0.001 floor.
  let displayValue = absValue;
  let amountConfig: Intl.NumberFormatOptions | null = null;
  if (applyAmountRule) {
    if (absValue > 0 && absValue < 1) {
      displayValue = Math.max(
        roundToOneSignificantDigit(absValue),
        AMOUNT_FLOOR
      );
    }
    amountConfig = {
      // 0 -> "$0"; otherwise always show at least 2 decimals.
      minimumFractionDigits: absValue === 0 ? 0 : 2,
      // The whole-dollar part shows exactly 2 decimals; below 1 the value has
      // already been rounded to 1 significant digit, so capping the fraction is
      // safe there too (e.g. 0.005 keeps 3 decimals via the rounded value).
      maximumFractionDigits: absValue >= 1 ? 2 : 20,
    };
  }

  const formatter = getCurrencyFormatter(locale, currency, {
    ...numberFormatOptions,
    ...amountConfig,
  });

  const modifyParts = config?.modifyParts;
  if (modifyParts) {
    const parts = formatter.formatToParts(displayValue);
    return `${sign}${modifyParts(parts)
      .map((part) => part.value)
      .join('')}`;
  }
  return `${sign}${formatter.format(displayValue)}`;
}

export function formatCurrencyToParts(
  value: BigNumber.Value,
  locale: string,
  currency: string,
  opts: Intl.NumberFormatOptions | null = null
) {
  const number = value instanceof BigNumber ? value.toNumber() : Number(value);
  const config = CURRENCIES[currency] as CurrencyConfig | undefined;
  const numberFormatOptions = resolveOptions(number, config || null, opts);
  const formatter = getCurrencyFormatter(locale, currency, numberFormatOptions);
  const parts = formatter.formatToParts(number);
  const modifyParts = CURRENCIES[currency]?.modifyParts;
  return modifyParts ? modifyParts(parts) : parts;
}

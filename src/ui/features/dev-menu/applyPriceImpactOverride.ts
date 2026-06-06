import BigNumber from 'bignumber.js';
import type { Quote2 } from 'src/shared/types/Quote';
import type { PriceImpactOverride } from './store-types';

const OVERRIDE_TO_PERCENT: Record<'3' | '7' | '20', number> = {
  '3': 3,
  '7': 7,
  '20': 20,
};

function scaleAmount<T extends Quote2['outputAmount']>(
  amount: T,
  factor: number
): T {
  if (!amount) return amount;
  const scaledQuantity = new BigNumber(amount.quantity).times(factor).toFixed();
  return {
    ...amount,
    quantity: scaledQuantity,
    value: amount.value == null ? amount.value : amount.value * factor,
    usdValue:
      amount.usdValue == null ? amount.usdValue : amount.usdValue * factor,
  };
}

function scaleQuote(quote: Quote2, factor: number): Quote2 {
  const next: Quote2 = {
    ...quote,
    outputAmount: scaleAmount(quote.outputAmount, factor),
    outputAmountAfterFees: scaleAmount(quote.outputAmountAfterFees, factor),
    minimumOutputAmount: scaleAmount(quote.minimumOutputAmount, factor),
  };
  if (quote.rate && quote.rate.length >= 2) {
    next.rate = quote.rate.map((r, i) =>
      i === 1 ? { ...r, value: r.value * factor } : r
    );
  }
  return next;
}

export function applyPriceImpactOverride({
  quotes,
  inputFiatValue,
  override,
}: {
  quotes: Quote2[] | null;
  inputFiatValue: number | null;
  override: PriceImpactOverride;
}): Quote2[] | null {
  if (!quotes || override === 'off') return quotes;

  if (inputFiatValue == null || inputFiatValue <= 0) return quotes;

  const targetRatio = 1 - OVERRIDE_TO_PERCENT[override] / 100;

  return quotes.map((quote) => {
    const outputValue = quote.outputAmount?.value;
    if (outputValue == null || outputValue <= 0) return quote;
    const factor = (inputFiatValue * targetRatio) / outputValue;
    if (!Number.isFinite(factor) || factor <= 0) return quote;
    return scaleQuote(quote, factor);
  });
}

import type { Amount } from 'src/modules/zerion-api/types/Amount';
import type { Quote2 } from 'src/shared/types/Quote';
import {
  EMPTY_QUOTE_PRICE_MEMO,
  nextQuotePriceMemo,
  selectEffectivePrice,
  selectSwapFormFiat,
} from 'src/ui/pages/SwapForm2/shared/quotePrice';
import { applyPriceImpactOverride } from './applyPriceImpactOverride';

function amount(quantity: string, value: number): Amount {
  return { currency: 'usd', quantity, value, usdValue: value };
}

describe('applyPriceImpactOverride', () => {
  test('override 7 shows -7% against the quote input value', () => {
    const quote = {
      inputAmount: amount('1', 100),
      outputAmount: amount('50', 90),
      outputAmountAfterFees: amount('49', 88),
      minimumOutputAmount: amount('48', 87),
      rate: [],
      // The rest of Quote2 is irrelevant to the override.
    } as unknown as Quote2;
    const inputPrice = 120;
    const resolvedInputAmount = '1';

    const [overridden] =
      applyPriceImpactOverride({
        quotes: [quote],
        inputFiatValue: Number(resolvedInputAmount) * inputPrice,
        override: '7',
      }) ?? [];

    const input = { chainId: 'solana', fungibleId: 'sol' };
    const output = { chainId: 'solana', fungibleId: 'xstock' };
    const quoteReceivedAt = 2_000;
    const positionsUpdatedAt = 1_000;
    const memo = nextQuotePriceMemo(EMPTY_QUOTE_PRICE_MEMO, {
      quote: overridden,
      input,
      output,
      currency: 'usd',
      now: quoteReceivedAt,
    });

    const { priceImpact } = selectSwapFormFiat({
      quote: overridden,
      resolvedInputAmount,
      inputPrice: selectEffectivePrice(
        memo.input,
        { ...input, currency: 'usd' },
        { price: inputPrice, updatedAt: positionsUpdatedAt },
      ),
      outputPrice: selectEffectivePrice(
        memo.output,
        { ...output, currency: 'usd' },
        { price: 2.5, updatedAt: positionsUpdatedAt },
      ),
    });
    expect(priceImpact?.kind).toBe('loss');
    expect(priceImpact?.kind === 'loss' ? priceImpact.ratio : null).toBeCloseTo(-0.07, 9);
  });
});

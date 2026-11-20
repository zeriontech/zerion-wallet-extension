import type { Amount } from 'src/modules/zerion-api/types/Amount';
import type { FungiblePosition } from 'src/modules/zerion-api/requests/wallet-get-simple-positions';
import type { Quote2 } from 'src/shared/types/Quote';
import { calculatePriceImpactFromPositions } from './price-impact';
import {
  EMPTY_QUOTE_PRICE_MEMO,
  nextQuotePriceMemo,
  priceFromQuoteAmount,
  selectEffectivePrice,
  selectSwapFormFiat,
  type QuotePriceEntry,
  type QuotePriceMemo,
} from './quotePrice';

function amount(quantity: string, value: number | null): Amount {
  return { currency: 'usd', quantity, value, usdValue: value };
}

function makeQuote({
  inputAmount,
  outputAmount,
}: {
  inputAmount?: Amount;
  outputAmount: Amount;
}): Quote2 {
  return {
    inputAmount,
    outputAmount,
    // Deliberately different from outputAmount: the form must never read these.
    outputAmountAfterFees: amount('7', 1),
    minimumOutputAmount: amount('3', 2),
    // The rest of Quote2 is irrelevant to the helpers.
  } as Quote2;
}

function makePosition(price: number | null): FungiblePosition {
  return { fungible: { meta: { price } } } as FungiblePosition;
}

describe('priceFromQuoteAmount', () => {
  test.each([
    ['value / quantity', amount('4', 10), 2.5],
    ['null value', amount('4', null), null],
    ['zero quantity', amount('0', 10), null],
    ['negative quantity', amount('-1', 10), null],
    ['non-numeric quantity', amount('abc', 10), null],
    ['missing amount', undefined, null],
    ['null amount', null, null],
  ])('%s', (_name, input, expected) => {
    expect(priceFromQuoteAmount(input)).toBe(expected);
  });
});

describe('selectSwapFormFiat receiveFiat', () => {
  const quote = makeQuote({ outputAmount: amount('5', 999) });
  test.each([
    ['quote present, price present', quote, 3, '15'],
    ['quote present, price null', quote, null, null],
    ['quote absent, price present', null, 3, null],
    ['quote absent, price null', null, null, null],
  ])('%s', (_name, q, outputPrice, expected) => {
    const { receiveFiat } = selectSwapFormFiat({
      quote: q,
      resolvedInputAmount: '1',
      inputPrice: null,
      outputPrice,
    });
    expect(receiveFiat?.toFixed() ?? null).toBe(expected);
  });
});

describe('selectSwapFormFiat payFiat', () => {
  test.each([
    ['amount × price', '2.5', 4, '10'],
    ['price null', '2.5', null, null],
    ['amount null', null, 4, null],
    ['amount empty', '', 4, null],
    ['amount non-numeric', 'abc', 4, null],
  ])('%s', (_name, resolvedInputAmount, inputPrice, expected) => {
    const { payFiat } = selectSwapFormFiat({
      quote: makeQuote({ inputAmount: amount('1', 777), outputAmount: amount('1', 1) }),
      resolvedInputAmount,
      inputPrice,
      outputPrice: 1,
    });
    expect(payFiat?.toFixed() ?? null).toBe(expected);
  });
});

describe('selectSwapFormFiat priceImpact', () => {
  // Pay is 1 × 100; receive is outputQuantity × 1.
  test.each([
    ['profit', '110', { kind: 'profit', ratio: 0.1 }],
    ['zero', '100', { kind: 'zero' }],
    ['low loss at -0.05', '95', { kind: 'loss', level: 'low', ratio: -0.05 }],
    ['medium loss below -0.05', '94', { kind: 'loss', level: 'medium', ratio: -0.06 }],
    ['medium loss at -0.15', '85', { kind: 'loss', level: 'medium', ratio: -0.15 }],
    ['high loss below -0.15', '84', { kind: 'loss', level: 'high', ratio: -0.16 }],
  ])('%s', (_name, outputQuantity, expected) => {
    const { priceImpact } = selectSwapFormFiat({
      quote: makeQuote({ outputAmount: amount(outputQuantity, 1) }),
      resolvedInputAmount: '1',
      inputPrice: 100,
      outputPrice: 1,
    });
    expect(priceImpact).toEqual(expected);
  });

  test.each([
    ['payFiat <= 0', '0', 100, 1, '5'],
    ['receiveFiat <= 0', '1', 100, 1, '0'],
  ])('%s is n/a', (_name, resolvedInputAmount, inputPrice, outputPrice, outputQuantity) => {
    const { priceImpact } = selectSwapFormFiat({
      quote: makeQuote({ outputAmount: amount(outputQuantity, 1) }),
      resolvedInputAmount,
      inputPrice,
      outputPrice,
    });
    expect(priceImpact).toEqual({ kind: 'n/a' });
  });

  test.each([
    ['input price missing', '1', null, 2, true],
    ['output price missing', '1', 2, null, true],
    ['amount non-numeric', 'abc', 2, 2, true],
    ['amount null', null, 2, 2, true],
    ['no quote', '1', 2, 2, false],
  ])(
    '%s matches calculatePriceImpactFromPositions',
    (_name, resolvedInputAmount, inputPrice, outputPrice, withQuote) => {
      const quote = withQuote ? makeQuote({ outputAmount: amount('3', 1) }) : null;
      const { priceImpact } = selectSwapFormFiat({
        quote,
        resolvedInputAmount,
        inputPrice,
        outputPrice,
      });
      expect(priceImpact).toEqual(
        calculatePriceImpactFromPositions({
          inputValue: resolvedInputAmount,
          outputValue: quote?.outputAmount.quantity ?? null,
          inputPosition: makePosition(inputPrice),
          outputPosition: makePosition(outputPrice),
        }),
      );
    },
  );
});

describe('selectEffectivePrice', () => {
  const entry: QuotePriceEntry = {
    chainId: 'solana',
    fungibleId: 'sol',
    currency: 'usd',
    price: 150,
    receivedAt: 1_000,
  };
  const key = { chainId: 'solana', fungibleId: 'sol', currency: 'usd' };

  test.each([
    ['quote newer than token data', { price: 140, updatedAt: 999 }, 150],
    ['quote at the same ms as token data', { price: 140, updatedAt: 1_000 }, 150],
    ['token data newer by 1 ms', { price: 140, updatedAt: 1_001 }, 140],
    ['position price null', { price: null, updatedAt: 2_000 }, 150],
    ['position updatedAt null', { price: 140, updatedAt: null }, 150],
  ])('%s', (_name, position, expected) => {
    expect(selectEffectivePrice(entry, key, position)).toBe(expected);
  });

  test.each([
    ['chainId', { ...key, chainId: 'ethereum' }],
    ['fungibleId', { ...key, fungibleId: 'usdc' }],
    ['currency', { ...key, currency: 'eur' }],
  ])('%s mismatch uses the position price', (_name, mismatchedKey) => {
    expect(selectEffectivePrice(entry, mismatchedKey, { price: 140, updatedAt: 0 })).toBe(140);
  });

  test('no entry uses the position price, which may be null', () => {
    expect(selectEffectivePrice(null, key, { price: 140, updatedAt: 0 })).toBe(140);
    expect(selectEffectivePrice(null, key, { price: null, updatedAt: null })).toBe(null);
  });
});

describe('nextQuotePriceMemo', () => {
  const input = { chainId: 'solana', fungibleId: 'sol' };
  const output = { chainId: 'solana', fungibleId: 'xstock' };

  function observe(prev: QuotePriceMemo, quote: Quote2, now: number) {
    return nextQuotePriceMemo(prev, { quote, input, output, currency: 'usd', now });
  }

  const first = observe(
    EMPTY_QUOTE_PRICE_MEMO,
    makeQuote({ inputAmount: amount('2', 300), outputAmount: amount('4', 280) }),
    1_000,
  );

  test('records both sides from the quote', () => {
    expect(first.input).toEqual({ ...input, currency: 'usd', price: 150, receivedAt: 1_000 });
    expect(first.output).toEqual({ ...output, currency: 'usd', price: 70, receivedAt: 1_000 });
  });

  test('a newer quote replaces both sides', () => {
    const next = observe(
      first,
      makeQuote({ inputAmount: amount('2', 320), outputAmount: amount('4', 300) }),
      2_000,
    );
    expect(next.input).toMatchObject({ price: 160, receivedAt: 2_000 });
    expect(next.output).toMatchObject({ price: 75, receivedAt: 2_000 });
  });

  test('a side with a null price keeps its previous entry', () => {
    const next = observe(
      first,
      makeQuote({ inputAmount: amount('2', null), outputAmount: amount('4', 300) }),
      2_000,
    );
    expect(next.input).toBe(first.input);
    expect(next.output).toMatchObject({ price: 75, receivedAt: 2_000 });
  });

  test('a quote without inputAmount keeps the input entry', () => {
    const next = observe(first, makeQuote({ outputAmount: amount('4', 300) }), 2_000);
    expect(next.input).toBe(first.input);
  });

  test('an older quote does not replace an entry', () => {
    const next = observe(
      first,
      makeQuote({ inputAmount: amount('2', 320), outputAmount: amount('4', 300) }),
      999,
    );
    expect(next).toEqual(first);
  });
});

describe('latest price wins end to end', () => {
  const inputKey = { chainId: 'solana', fungibleId: 'sol', currency: 'usd' };
  const outputKey = { chainId: 'solana', fungibleId: 'xstock', currency: 'usd' };
  const quote = makeQuote({ inputAmount: amount('2', 300), outputAmount: amount('4', 280) });
  const memo = nextQuotePriceMemo(EMPTY_QUOTE_PRICE_MEMO, {
    quote,
    input: inputKey,
    output: outputKey,
    currency: 'usd',
    now: 1_000,
  });

  function render(inputUpdatedAt: number, outputUpdatedAt: number) {
    return selectSwapFormFiat({
      quote,
      resolvedInputAmount: '2',
      inputPrice: selectEffectivePrice(memo.input, inputKey, {
        price: 140,
        updatedAt: inputUpdatedAt,
      }),
      outputPrice: selectEffectivePrice(memo.output, outputKey, {
        price: 80,
        updatedAt: outputUpdatedAt,
      }),
    });
  }

  test('right after the quote, Pay, Receive and impact equal the quote values', () => {
    const { payFiat, receiveFiat, priceImpact } = render(500, 500);
    expect(payFiat?.toFixed()).toBe('300');
    expect(receiveFiat?.toFixed()).toBe('280');
    expect(priceImpact?.kind === 'loss' ? priceImpact.ratio : null).toBeCloseTo(-20 / 300, 12);
  });

  test('newer output token data switches only Receive', () => {
    const { payFiat, receiveFiat } = render(500, 1_001);
    expect(payFiat?.toFixed()).toBe('300');
    expect(receiveFiat?.toFixed()).toBe('320');
  });
});

import type { Amount } from 'src/modules/zerion-api/types/Amount';
import type { FungiblePosition } from 'src/modules/zerion-api/requests/wallet-get-simple-positions';
import type { Quote2 } from 'src/shared/types/Quote';
import { calculatePriceImpactFromPositions } from './price-impact';
import {
  EMPTY_QUOTE_PRICE_MEMO,
  QUOTE_PRICE_TTL_MS,
  nextQuotePriceMemo,
  priceFromQuoteAmount,
  selectEffectivePrice,
  selectSwapFormFiat,
  type QuotePriceEntry,
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
    outputAmountAfterFees: amount(outputAmount.quantity, 1),
    minimumOutputAmount: amount(outputAmount.quantity, 2),
    // The rest of Quote2 is irrelevant to the helpers.
  } as Quote2;
}

function makePosition(price: number | null): FungiblePosition {
  return { fungible: { meta: { price } } } as FungiblePosition;
}

const fiatArgs = {
  resolvedInputAmount: '1',
  inputPrice: null,
  outputPrice: null,
  inputPositionPrice: null,
  outputPositionPrice: null,
};

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
  test.each([
    { quote: true, value: 123.45, outputPrice: 70, expected: '123.45' },
    { quote: true, value: 123.45, outputPrice: null, expected: '123.45' },
    { quote: true, value: null, outputPrice: 70, expected: '140' },
    { quote: true, value: null, outputPrice: null, expected: null },
    { quote: false, value: 123.45, outputPrice: 70, expected: null },
    { quote: false, value: 123.45, outputPrice: null, expected: null },
    { quote: false, value: null, outputPrice: 70, expected: null },
    { quote: false, value: null, outputPrice: null, expected: null },
  ])(
    'quote=$quote value=$value outputPrice=$outputPrice -> $expected',
    ({ quote, value, outputPrice, expected }) => {
      const { receiveFiat } = selectSwapFormFiat({
        ...fiatArgs,
        quote: quote ? makeQuote({ outputAmount: amount('2', value) }) : null,
        outputPrice,
      });
      expect(receiveFiat?.toFixed() ?? null).toBe(expected);
    },
  );
});

describe('selectSwapFormFiat payFiat', () => {
  test.each([
    {
      name: 'quote value when quantity matches',
      inputAmount: amount('1.50', 300.12),
      inputPrice: 100,
      expected: '300.12',
    },
    {
      name: 'quote value without a price',
      inputAmount: amount('1.5', 300.12),
      inputPrice: null,
      expected: '300.12',
    },
    { name: 'no quote', quote: false, inputPrice: 100, expected: '150' },
    { name: 'no quote, no price', quote: false, inputPrice: null, expected: null },
    { name: 'quote without inputAmount', inputPrice: 100, expected: '150' },
    {
      name: 'quote value null',
      inputAmount: amount('1.5', null),
      inputPrice: 100,
      expected: '150',
    },
    {
      name: 'quote value null, no price',
      inputAmount: amount('1.5', null),
      inputPrice: null,
      expected: null,
    },
    {
      name: 'quantity mismatch',
      inputAmount: amount('1.4', 300.12),
      inputPrice: 100,
      expected: '150',
    },
    {
      name: 'quantity mismatch, no price',
      inputAmount: amount('1.4', 300.12),
      inputPrice: null,
      expected: null,
    },
  ])('$name', ({ quote = true, inputAmount, inputPrice, expected }) => {
    const { payFiat } = selectSwapFormFiat({
      ...fiatArgs,
      quote: quote ? makeQuote({ inputAmount, outputAmount: amount('2', 200) }) : null,
      resolvedInputAmount: '1.5',
      inputPrice,
    });
    expect(payFiat?.toFixed() ?? null).toBe(expected);
  });
});

describe('selectSwapFormFiat priceImpact', () => {
  test('quote values decide regardless of position prices', () => {
    const quote = makeQuote({
      inputAmount: amount('1', 100),
      outputAmount: amount('2', 97),
    });
    const variants = [
      { inputPositionPrice: null, outputPositionPrice: null },
      { inputPositionPrice: 100, outputPositionPrice: 48.5 },
      { inputPositionPrice: 1000, outputPositionPrice: 48.5 },
    ];
    const results = variants.map((positionPrices) =>
      selectSwapFormFiat({ ...fiatArgs, quote, ...positionPrices }),
    );
    for (const { priceImpact } of results) {
      expect(priceImpact).toEqual({ kind: 'loss', level: 'low', ratio: -0.03 });
    }
  });

  test.each([
    { output: 110, expected: { kind: 'profit', ratio: 0.1 } },
    { output: 100, expected: { kind: 'zero' } },
    { output: 95, expected: { kind: 'loss', level: 'low', ratio: -0.05 } },
    { output: 94.9, expected: { kind: 'loss', level: 'medium', ratio: -0.051 } },
    { output: 85, expected: { kind: 'loss', level: 'medium', ratio: -0.15 } },
    { output: 84.9, expected: { kind: 'loss', level: 'high', ratio: -0.151 } },
    { output: 0, expected: { kind: 'n/a' } },
  ])('output value $output for input value 100', ({ output, expected }) => {
    const { priceImpact } = selectSwapFormFiat({
      ...fiatArgs,
      quote: makeQuote({ inputAmount: amount('1', 100), outputAmount: amount('2', output) }),
      inputPositionPrice: 1,
      outputPositionPrice: 1,
    });
    expect(priceImpact).toEqual(expected);
  });

  test('non-positive quote input value is n/a', () => {
    const { priceImpact } = selectSwapFormFiat({
      ...fiatArgs,
      quote: makeQuote({ inputAmount: amount('1', 0), outputAmount: amount('2', 100) }),
    });
    expect(priceImpact).toEqual({ kind: 'n/a' });
  });

  test.each([
    { name: 'input value null', inputValue: null, outputValue: 97 },
    { name: 'output value null', inputValue: 100, outputValue: null },
    { name: 'no inputAmount', inputValue: undefined, outputValue: 97 },
  ])('$name falls back to position prices', ({ inputValue, outputValue }) => {
    const quote = makeQuote({
      inputAmount: inputValue === undefined ? undefined : amount('3', inputValue),
      outputAmount: amount('2', outputValue),
    });
    for (const [inputPositionPrice, outputPositionPrice] of [
      [10, 12],
      [10, 15],
      [null, 12],
    ]) {
      const { priceImpact } = selectSwapFormFiat({
        ...fiatArgs,
        quote,
        resolvedInputAmount: '3',
        inputPositionPrice,
        outputPositionPrice,
      });
      expect(priceImpact).toEqual(
        calculatePriceImpactFromPositions({
          inputValue: '3',
          outputValue: '2',
          inputPosition: makePosition(inputPositionPrice),
          outputPosition: makePosition(outputPositionPrice),
        }),
      );
    }
    const { priceImpact } = selectSwapFormFiat({
      ...fiatArgs,
      quote,
      resolvedInputAmount: '3',
      inputPositionPrice: 10,
      outputPositionPrice: 12,
    });
    expect(priceImpact).toEqual({ kind: 'loss', level: 'high', ratio: -0.2 });
  });

  test('no quote falls back to position prices', () => {
    const { priceImpact } = selectSwapFormFiat({
      ...fiatArgs,
      quote: null,
      inputPositionPrice: 10,
      outputPositionPrice: 12,
    });
    expect(priceImpact).toEqual({ kind: 'n/a' });
  });

  test.each([null, '', 'abc'])('non-numeric resolvedInputAmount %j gives null', (value) => {
    const { priceImpact } = selectSwapFormFiat({
      ...fiatArgs,
      quote: makeQuote({ inputAmount: amount('1', 100), outputAmount: amount('2', 97) }),
      resolvedInputAmount: value,
    });
    expect(priceImpact).toBeNull();
  });
});

describe('selectEffectivePrice', () => {
  const receivedAt = 1_000_000;
  const entry: QuotePriceEntry = {
    chainId: 'solana',
    fungibleId: 'sol',
    currency: 'usd',
    price: 150,
    receivedAt,
  };
  const key = { chainId: 'solana', fungibleId: 'sol', currency: 'usd' };

  test('TTL is 40 seconds', () => {
    expect(QUOTE_PRICE_TTL_MS).toBe(40_000);
  });

  test.each([
    { age: 0, fallback: 140, expected: 150 },
    { age: 0, fallback: null, expected: 150 },
    { age: 39_999, fallback: 140, expected: 150 },
    { age: 39_999, fallback: null, expected: 150 },
    { age: 40_000, fallback: 140, expected: 140 },
    { age: 40_000, fallback: null, expected: null },
  ])('age $age with fallback $fallback -> $expected', ({ age, fallback, expected }) => {
    expect(selectEffectivePrice(entry, key, receivedAt + age, fallback)).toBe(expected);
  });

  test.each([
    { ...key, chainId: 'ethereum' },
    { ...key, fungibleId: 'usdc' },
    { ...key, currency: 'eur' },
  ])('key mismatch %j falls back', (mismatched) => {
    expect(selectEffectivePrice(entry, mismatched, receivedAt, 140)).toBe(140);
  });

  test('no entry falls back', () => {
    expect(selectEffectivePrice(null, key, receivedAt, 140)).toBe(140);
  });
});

describe('nextQuotePriceMemo', () => {
  const input = { chainId: 'solana', fungibleId: 'sol' };
  const output = { chainId: 'solana', fungibleId: 'xstock' };

  function observe(prev: typeof EMPTY_QUOTE_PRICE_MEMO, quote: Quote2, now: number) {
    return nextQuotePriceMemo(prev, { quote, input, output, currency: 'usd', now });
  }

  const first = observe(
    EMPTY_QUOTE_PRICE_MEMO,
    makeQuote({ inputAmount: amount('2', 300), outputAmount: amount('4', 290) }),
    1000,
  );

  test('records both sides from the quote', () => {
    expect(first).toEqual({
      input: { ...input, currency: 'usd', price: 150, receivedAt: 1000 },
      output: { ...output, currency: 'usd', price: 72.5, receivedAt: 1000 },
    });
  });

  test('a newer quote replaces both sides', () => {
    const next = observe(
      first,
      makeQuote({ inputAmount: amount('2', 310), outputAmount: amount('4', 300) }),
      2000,
    );
    expect(next.input).toEqual({ ...input, currency: 'usd', price: 155, receivedAt: 2000 });
    expect(next.output).toEqual({ ...output, currency: 'usd', price: 75, receivedAt: 2000 });
  });

  test('a side with a null price keeps its previous entry', () => {
    const next = observe(
      first,
      makeQuote({ inputAmount: amount('2', null), outputAmount: amount('4', 300) }),
      2000,
    );
    expect(next.input).toBe(first.input);
    expect(next.output?.price).toBe(75);
  });

  test('a quote without inputAmount keeps the input entry', () => {
    const next = observe(first, makeQuote({ outputAmount: amount('4', null) }), 2000);
    expect(next).toEqual(first);
  });

  test('an older quote does not replace an entry', () => {
    const next = observe(
      first,
      makeQuote({ inputAmount: amount('2', 310), outputAmount: amount('4', 300) }),
      500,
    );
    expect(next).toEqual(first);
  });
});

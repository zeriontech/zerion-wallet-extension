import type { Quote2 } from './Quote';
import {
  filterQuotesByIntentCapability,
  isExecutableQuote,
  isIntentQuote,
} from './Quote';
import {
  INTENT_EVM,
  INTENT_SOLANA,
  QUOTE_ERROR,
  SWAP_TX_EVM,
  errorQuote,
  intentQuote,
  intentQuoteWithoutId,
  onChainQuote,
} from './Quote.fixtures';

type QuoteFields = Pick<
  Quote2,
  'error' | 'transactionSwap' | 'intentSwap' | 'quoteId'
>;

const errors = { null: null, set: QUOTE_ERROR } as const;
const transactionSwaps = {
  null: null,
  set: { evm: SWAP_TX_EVM, solana: null },
} as const;
const intentSwaps = {
  null: null,
  evm: INTENT_EVM,
  solana: INTENT_SOLANA,
} as const;
const quoteIds = { empty: '', set: 'q-123' } as const;

// Expected values written out from web's Quote.ts @ 60bd6e501, not computed.
// [error, transactionSwap, intentSwap, quoteId, isIntentQuote, isExecutableQuote]
const TABLE: Array<
  [
    keyof typeof errors,
    keyof typeof transactionSwaps,
    keyof typeof intentSwaps,
    keyof typeof quoteIds,
    boolean,
    boolean
  ]
> = [
  ['null', 'null', 'null', 'empty', false, false],
  ['null', 'null', 'null', 'set', false, false],
  ['null', 'null', 'evm', 'empty', false, false],
  ['null', 'null', 'evm', 'set', true, true],
  ['null', 'null', 'solana', 'empty', false, false],
  ['null', 'null', 'solana', 'set', true, true],
  ['null', 'set', 'null', 'empty', false, true],
  ['null', 'set', 'null', 'set', false, true],
  ['null', 'set', 'evm', 'empty', false, true],
  ['null', 'set', 'evm', 'set', true, true],
  ['null', 'set', 'solana', 'empty', false, true],
  ['null', 'set', 'solana', 'set', true, true],
  ['set', 'null', 'null', 'empty', false, false],
  ['set', 'null', 'null', 'set', false, false],
  ['set', 'null', 'evm', 'empty', false, false],
  ['set', 'null', 'evm', 'set', true, false],
  ['set', 'null', 'solana', 'empty', false, false],
  ['set', 'null', 'solana', 'set', true, false],
  ['set', 'set', 'null', 'empty', false, false],
  ['set', 'set', 'null', 'set', false, false],
  ['set', 'set', 'evm', 'empty', false, false],
  ['set', 'set', 'evm', 'set', true, false],
  ['set', 'set', 'solana', 'empty', false, false],
  ['set', 'set', 'solana', 'set', true, false],
];

describe('isIntentQuote and isExecutableQuote', () => {
  test('the table covers all 24 combinations exactly once', () => {
    const keys = new Set(TABLE.map((row) => row.slice(0, 4).join('/')));
    expect(TABLE).toHaveLength(24);
    expect(keys.size).toBe(24);
  });

  test.each(TABLE)(
    'error=%s transactionSwap=%s intentSwap=%s quoteId=%s → intent=%s executable=%s',
    (error, transactionSwap, intentSwap, quoteId, intent, executable) => {
      const quote: QuoteFields = {
        error: errors[error],
        transactionSwap: transactionSwaps[transactionSwap],
        intentSwap: intentSwaps[intentSwap],
        quoteId: quoteIds[quoteId],
      };
      expect(isIntentQuote(quote)).toBe(intent);
      expect(isExecutableQuote(quote)).toBe(executable);
    }
  );
});

describe('filterQuotesByIntentCapability', () => {
  const stream = [intentQuote, onChainQuote, errorQuote, intentQuoteWithoutId];

  test('drops intent quotes and keeps order when intents are disallowed', () => {
    expect(filterQuotesByIntentCapability(stream, false)).toEqual([
      onChainQuote,
      errorQuote,
      intentQuoteWithoutId,
    ]);
  });

  test('keeps every quote in order when intents are allowed', () => {
    expect(filterQuotesByIntentCapability(stream, true)).toEqual(stream);
  });

  test('passes null through', () => {
    expect(filterQuotesByIntentCapability(null, false)).toBeNull();
    expect(filterQuotesByIntentCapability(null, true)).toBeNull();
  });
});

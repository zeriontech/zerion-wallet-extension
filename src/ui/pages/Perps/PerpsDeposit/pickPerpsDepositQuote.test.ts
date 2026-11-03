import {
  errorQuote,
  intentQuote,
  intentQuoteWithoutId,
  makeQuote,
  onChainQuote,
  SWAP_TX_EVM,
} from 'src/shared/types/Quote.fixtures';
import { pickPerpsDepositQuote } from './pickPerpsDepositQuote';

describe('pickPerpsDepositQuote', () => {
  test('skips a leading intent quote and picks the first executable non-intent quote', () => {
    const secondOnChain = makeQuote('relay', {
      transactionSwap: { evm: SWAP_TX_EVM, solana: null },
      quoteId: 'q-relay',
    });
    expect(
      pickPerpsDepositQuote([
        intentQuote,
        errorQuote,
        intentQuoteWithoutId,
        onChainQuote,
        secondOnChain,
      ])
    ).toBe(onChainQuote);
  });

  test('picks nothing when only intent and error quotes arrive', () => {
    expect(
      pickPerpsDepositQuote([intentQuote, errorQuote, intentQuoteWithoutId])
    ).toBeNull();
  });

  test('picks nothing without quotes', () => {
    expect(pickPerpsDepositQuote(null)).toBeNull();
  });
});

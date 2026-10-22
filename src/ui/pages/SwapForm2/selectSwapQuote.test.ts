import { filterQuotesByIntentCapability } from 'src/shared/types/Quote';
import {
  errorQuote,
  intentQuote,
  intentQuoteWithoutId,
  onChainQuote,
} from 'src/shared/types/Quote.fixtures';
import { selectDefaultQuote, selectSwapQuote } from './selectSwapQuote';

const mixed = [intentQuoteWithoutId, intentQuote, errorQuote, onChainQuote];

function selectDefault(quotes: typeof mixed, allowIntents: boolean) {
  return selectDefaultQuote(
    filterQuotesByIntentCapability(quotes, allowIntents)
  );
}

describe('selectDefaultQuote over a capability-filtered stream', () => {
  test('intents disallowed: skips the intent quote and selects the on-chain one', () => {
    expect(selectDefault(mixed, false)).toBe(onChainQuote);
  });

  test('intents allowed: selects the first executable quote, the intent one', () => {
    expect(selectDefault(mixed, true)).toBe(intentQuote);
  });

  test('intents disallowed: a stream of only intent quotes selects nothing', () => {
    expect(selectDefault([intentQuote], false)).toBeNull();
  });

  test('an intent quote with an empty quoteId is never selected', () => {
    expect(selectDefault([intentQuoteWithoutId], false)).toBeNull();
    expect(selectDefault([intentQuoteWithoutId], true)).toBeNull();
  });

  test('without an executable quote, an error quote is selected so its error shows', () => {
    expect(selectDefault([intentQuote, errorQuote], false)).toBe(errorQuote);
    expect(selectDefault([intentQuoteWithoutId, errorQuote], true)).toBe(
      errorQuote
    );
  });

  test('null stream selects nothing', () => {
    expect(selectDefaultQuote(null)).toBeNull();
  });
});

describe('selectSwapQuote', () => {
  test('a user pick of a filtered-out intent quote falls back to the default', () => {
    const quotes = filterQuotesByIntentCapability(mixed, false);
    expect(
      selectSwapQuote({
        quotes,
        userQuoteId: intentQuote.contractMetadata.id,
      })
    ).toBe(onChainQuote);
  });

  test('a user pick present in the list wins over the default', () => {
    const quotes = filterQuotesByIntentCapability(mixed, true);
    expect(
      selectSwapQuote({
        quotes,
        userQuoteId: onChainQuote.contractMetadata.id,
      })
    ).toBe(onChainQuote);
  });
});

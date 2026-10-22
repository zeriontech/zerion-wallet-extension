import type { Quote2 } from 'src/shared/types/Quote';
import { isExecutableQuote } from 'src/shared/types/Quote';

/** An error quote is the fallback so its error stays visible; it is never executable */
export function selectDefaultQuote<T extends Quote2>(
  quotes: T[] | null
): T | null {
  if (!quotes) {
    return null;
  }
  return (
    quotes.find((quote) => isExecutableQuote(quote)) ??
    quotes.find((quote) => quote.error != null) ??
    null
  );
}

export function selectSwapQuote<T extends Quote2>({
  quotes,
  userQuoteId,
}: {
  quotes: T[] | null;
  userQuoteId: string | null;
}): T | null {
  const userQuote = quotes?.find(
    (quote) => quote.contractMetadata?.id === userQuoteId
  );
  return userQuote || selectDefaultQuote(quotes);
}

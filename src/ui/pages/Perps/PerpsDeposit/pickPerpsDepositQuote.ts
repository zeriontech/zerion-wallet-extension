import type { Quote2 } from 'src/shared/types/Quote';
import { filterQuotesByIntentCapability, isExecutableQuote } from 'src/shared/types/Quote';

export function pickPerpsDepositQuote<T extends Quote2>(
  quotes: T[] | null,
  quoteId: string | null = null,
): T | null {
  const executable =
    filterQuotesByIntentCapability(quotes, false)?.filter((quote) => isExecutableQuote(quote)) ??
    [];
  if (quoteId) {
    const selected = executable.find((quote) => quote.quoteId === quoteId);
    if (selected) return selected;
  }
  return executable[0] ?? null;
}

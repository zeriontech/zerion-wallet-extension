import type { Quote2 } from 'src/shared/types/Quote';
import {
  filterQuotesByIntentCapability,
  isExecutableQuote,
} from 'src/shared/types/Quote';

export function pickPerpsDepositQuote<T extends Quote2>(
  quotes: T[] | null
): T | null {
  return (
    filterQuotesByIntentCapability(quotes, false)?.find((quote) =>
      isExecutableQuote(quote)
    ) ?? null
  );
}

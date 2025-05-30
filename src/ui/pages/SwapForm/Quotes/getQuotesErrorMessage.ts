import { getError } from 'src/shared/errors/getError';
import type { Quote2 } from 'src/shared/types/Quote';
import type { QuotesData } from 'src/ui/shared/requests/useQuotes';

const quoteApiErrors: Record<string, string | undefined> = {
  'Cannot process input_amount parameter': 'Adjust amount value',
  'Cannot process output_amount parameter': 'Adjust amount value',
};

export function getQuotesErrorMessage(quotesData: QuotesData<Quote2>) {
  const quotesMessage = getError(quotesData.error).message;
  return quoteApiErrors[quotesMessage] || quotesMessage;
}

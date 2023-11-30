import { getError } from 'src/shared/errors/getError';
import type { QuotesData } from './useQuotes';

const quoteApiErrors: Record<string, string | undefined> = {
  'Cannot process input_amount parameter': 'Adjust amount value',
  'Cannot process output_amount parameter': 'Adjust amount value',
};

export function getQuotesErrorMessage(quotesData: QuotesData) {
  const quotesMessage = getError(quotesData.error).message;
  return quoteApiErrors[quotesMessage] || quotesMessage;
}

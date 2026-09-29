import type { QuoteErrorDetails } from './quoteErrorDetails';

/** A failed quotes request (a Quote Error, see CONTEXT.md). */
export class QuotesError extends Error {
  status: number;
  /** Backend-authored wording, when the error response carried any. */
  details: QuoteErrorDetails | null;

  constructor(
    message: string,
    status: number,
    details: QuoteErrorDetails | null = null
  ) {
    super(message);
    this.name = 'QuotesError';
    this.status = status;
    this.details = details;
  }
}

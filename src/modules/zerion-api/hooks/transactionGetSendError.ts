import { HTTPError } from 'ky';
import {
  parseQuoteErrorDetails,
  type QuoteErrorDetails,
} from 'src/ui/shared/requests/quoteErrorDetails';

/** A get-send request answered with a non-2xx HTTP status. */
export class TransactionGetSendError extends Error {
  status: number;
  /** Backend-authored wording, when the error response carried any. */
  details: QuoteErrorDetails | null;

  constructor(status: number, details: QuoteErrorDetails | null) {
    super(`transaction/get-send/v1 responded with ${status}`);
    this.name = 'TransactionGetSendError';
    this.status = status;
    this.details = details;
  }
}

export function isClientErrorStatus(status: number) {
  return status >= 400 && status <= 499;
}

export async function responseToTransactionGetSendError(
  response: Response
): Promise<TransactionGetSendError> {
  const details = await response
    .json()
    .then(parseQuoteErrorDetails, () => null);
  return new TransactionGetSendError(response.status, details);
}

export async function toTransactionGetSendError(
  error: unknown
): Promise<unknown> {
  if (error instanceof HTTPError) {
    return responseToTransactionGetSendError(error.response);
  }
  return error;
}

export function shouldRetryTransactionGetSend(
  failureCount: number,
  error: unknown
) {
  if (
    error instanceof TransactionGetSendError &&
    isClientErrorStatus(error.status)
  ) {
    return false;
  }
  return failureCount < 1;
}

export function getSendRequestClientError(
  error: unknown
): TransactionGetSendError | null {
  return error instanceof TransactionGetSendError &&
    isClientErrorStatus(error.status)
    ? error
    : null;
}

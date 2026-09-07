import {
  isOrderExecutionError,
  isStaleQuoteError,
} from 'src/shared/errors/OrderExecutionError';

export const STALE_QUOTE_MESSAGE =
  'The quote expired before the order was placed. Try again.';
export const ORDER_PLACEMENT_FAILED_MESSAGE =
  "Couldn't place the order. Try again.";

/** Maps an `execute-order` failure to the copy shown in the form */
export function toFormError(error: unknown): unknown {
  if (isStaleQuoteError(error)) {
    return Object.assign(new Error(STALE_QUOTE_MESSAGE), { cause: error });
  }
  if (isOrderExecutionError(error)) {
    return Object.assign(new Error(ORDER_PLACEMENT_FAILED_MESSAGE), {
      cause: error,
    });
  }
  return error;
}

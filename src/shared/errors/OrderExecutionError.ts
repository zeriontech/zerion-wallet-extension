/**
 * `transaction/execute-order/v1` rejected the Order. Thrown by the background
 * `submitSwapOrder` and delivered to the UI across the wallet port, which only
 * preserves `message`, `name`, `code` and `data` (see toEnumerableError), so
 * the HTTP status travels inside `data`.
 */
export const ORDER_EXECUTION_ERROR_CODE = 5400;

export interface OrderExecutionErrorData {
  /** HTTP status; 400 = stale quote or bad signature */
  status: number;
  /** Raw response body, for analytics; may be null */
  body: string | null;
}

export class OrderExecutionError extends Error {
  name = 'OrderExecutionError';
  code = ORDER_EXECUTION_ERROR_CODE;
  data: OrderExecutionErrorData;

  constructor(message: string, data: OrderExecutionErrorData) {
    super(message);
    this.data = data;
  }
}

export function isOrderExecutionError(
  error: unknown
): error is { message: string; code: number; data: OrderExecutionErrorData } {
  return (
    typeof error === 'object' &&
    error != null &&
    'code' in error &&
    (error as { code: unknown }).code === ORDER_EXECUTION_ERROR_CODE &&
    'data' in error &&
    typeof (error as { data: unknown }).data === 'object'
  );
}

/** True when the backend refused our request: the quote expired or a signature is wrong */
export function isStaleQuoteError(error: unknown): boolean {
  return isOrderExecutionError(error) && error.data.status === 400;
}

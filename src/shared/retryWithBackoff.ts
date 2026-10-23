import { HTTPError, TimeoutError } from 'ky';
import { wait } from './wait';

/** Network failure, timeout, 429 or 5xx: the same request may succeed later */
export function isTransientRequestError(error: unknown) {
  if (error instanceof TimeoutError || error instanceof TypeError) {
    return true;
  }
  if (error instanceof HTTPError) {
    const { status } = error.response;
    return status === 429 || status >= 500;
  }
  return false;
}

/** Waits `baseDelayMs * 2 ** n` after the n-th failed attempt */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  {
    attempts = 4,
    baseDelayMs = 1000,
    shouldRetry = isTransientRequestError,
  }: {
    attempts?: number;
    baseDelayMs?: number;
    shouldRetry?: (error: unknown) => boolean;
  } = {}
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt + 1 >= attempts || !shouldRetry(error)) {
        throw error;
      }
      await wait(baseDelayMs * 2 ** attempt);
    }
  }
}

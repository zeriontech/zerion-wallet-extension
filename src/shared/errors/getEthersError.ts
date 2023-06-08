import type { ExtendedError } from './errors';
import { getError } from './getError';

export function getEthersError(error: unknown): ExtendedError {
  if (
    error instanceof Error &&
    'body' in error &&
    typeof error.body === 'string'
  ) {
    try {
      // error.body may be a JsonRpcError
      const parsed = JSON.parse(error.body);
      return getError(parsed);
    } catch (_err) {
      return getError(error);
    }
  } else {
    return getError(error);
  }
}

import { isObj } from 'src/shared/isObj';
import { getError } from './getError';

function tryErrorBody(value: unknown) {
  if (isObj(value) && 'body' in value && typeof value.body === 'string') {
    try {
      // error.body may be a JsonRpcError
      const parsed = JSON.parse(value.body);
      return getError(parsed);
    } catch (_err) {
      return getError(value);
    }
  }
}

export function getEthersError(value: unknown): Error {
  if (value instanceof Error) {
    if ('error' in value && isObj(value.error)) {
      if (value.error.error instanceof Error) {
        /** Yes, this is what ethers may return :( */
        return value.error.error;
      }
    }
    const parsedBodyError = tryErrorBody(value);
    if (parsedBodyError) {
      return parsedBodyError;
    }
  }
  return getError(value);
}

import { anyPromise } from '../anyPromise';
import { sessionCacheService } from '../channels';

export async function requestWithCache<T>(
  key: string,
  request: Promise<T>,
  options?: {
    cacheTime?: number;
    // no need to cache broken or empty values,
    // so we can use validation function to exclude these cases
    validationFn?: (result: T) => boolean;
  }
) {
  return anyPromise([
    sessionCacheService.request('getCache', { key }).then((result) => {
      if (
        options?.cacheTime &&
        Date.now() - result.timestamp > options.cacheTime
      ) {
        throw new Error('Cache is obsolete');
      }
      if (!result.value) {
        throw new Error('Empty cache for request');
      }
      return result.value as T;
    }),
    request.then((result) => {
      if (!options?.validationFn || options.validationFn(result)) {
        sessionCacheService.request('setCache', { key, value: result });
      }
      return result;
    }),
  ]);
}

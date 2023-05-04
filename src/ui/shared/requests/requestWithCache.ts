import { anyPromise } from '../anyPromise';
import { sessionCacheService } from '../channels';

export async function requestWithCache<T>(
  key: string,
  request: Promise<T>,
  options?: {
    cacheTime?: number;
  }
) {
  return anyPromise([
    request.then((result) => {
      sessionCacheService.request('setCache', { key, value: result });
      return result;
    }),
    sessionCacheService.request('getCache', { key }).then((result) => {
      if (
        options?.cacheTime &&
        Date.now() - result.timestamp > options.cacheTime
      ) {
        throw new Error('Cache is obsolete');
      }
      return result.value as T;
    }),
  ]);
}

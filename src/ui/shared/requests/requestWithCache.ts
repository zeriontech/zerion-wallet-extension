import { anyPromise, isAggregateError } from '../anyPromise';
import { sessionCacheService } from '../channels';

export class EmptyResult extends Error {}

export async function requestWithCache<T>(
  key: string,
  request: Promise<T>,
  options?: {
    cacheTime?: number;
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
      sessionCacheService.request('setCache', { key, value: result });
      return result;
    }),
  ]).catch((error) => {
    if (
      isAggregateError(error) &&
      error.errors.some((err) => err instanceof EmptyResult)
    ) {
      return null;
    } else {
      throw error;
    }
  });
}

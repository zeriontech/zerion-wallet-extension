import { anyPromise } from '../../anyPromise';
import { cacheServicePort } from './../../channels';

export async function requestWithCache<T>(
  key: string,
  request: Promise<T>,
  options?: {
    cacheTime?: number;
  }
) {
  return anyPromise([
    request.then((result) => {
      cacheServicePort.request('setCache', { key, value: result });
      return result;
    }),
    cacheServicePort.request('getCache', { key }).then((result) => {
      if (
        options?.cacheTime &&
        Date.now() - result.timestamp > options.cacheTime
      ) {
        return Promise.reject('Cache is obsolete');
      }
      return result.value as T;
    }),
  ]);
}

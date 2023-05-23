import { RequestCache } from './request-cache';

jest.useFakeTimers();

const fetchIdentity = (value: string) =>
  new Promise<string>((resolve) => setTimeout(() => resolve(value), 10));

describe('request-cache', () => {
  test('get resolves', () => {
    const requestCache = new RequestCache();
    const key = 'key';
    const promise = requestCache.get(key, () => fetchIdentity('hello'));
    expect(promise).resolves.toBe('hello');
  });

  test('get calls with same key make only 1 request', () => {
    const requestCache = new RequestCache();
    const key = 'key-2-calls';
    const getter1 = jest.fn(() => fetchIdentity('one'));
    const getter2 = jest.fn(() => fetchIdentity('two'));
    const promise1 = requestCache.get(key, getter1);
    const promise2 = requestCache.get(key, getter2);
    expect(promise1).resolves.toBe('one');
    expect(promise1).toStrictEqual(promise2);
    expect(getter1).toHaveBeenCalledTimes(1);
    expect(getter2).toHaveBeenCalledTimes(0);
  });

  test('staleTime', async () => {
    const requestCache = new RequestCache();
    const key = 'key-staleTime';
    const getter1 = jest.fn(() => fetchIdentity('apple'));
    const getter2 = jest.fn(() => fetchIdentity('cherry'));

    const options = { staleTime: 50 };

    const callback1 = jest.fn();
    const callback2 = jest.fn();
    const callback3 = jest.fn();
    const callback4 = jest.fn();

    const next = Promise.all([
      requestCache.get(key, getter1, options).then(callback1),
      requestCache.get('another-key', getter1, options).then(callback2),
      requestCache.get(key, getter2).then(callback3),
    ]);

    jest.runAllTimers();
    await next;

    expect(getter1).toHaveBeenCalledTimes(2);
    expect(getter2).toHaveBeenCalledTimes(0);
    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback1).toHaveBeenLastCalledWith('apple');

    expect(getter1).toHaveBeenCalledTimes(2);
    requestCache.get(key, getter2);
    jest.advanceTimersByTime(options.staleTime + 10);
    const next2 = requestCache.get(key, getter2).then(callback4);
    jest.runAllTimers();
    await next2;
    expect(callback4).toHaveBeenCalledTimes(1);
    expect(callback4).toHaveBeenLastCalledWith('cherry');
    expect(getter2).toHaveBeenCalledTimes(1);
  });
});

describe('RequestCache tests by GPT-4', () => {
  let cache: RequestCache;

  beforeEach(() => {
    cache = new RequestCache();
  });

  it('should create a new item if not present in cache', async () => {
    const key = 'key1';
    const getter = jest.fn(() => Promise.resolve('data'));

    await cache.get(key, getter);

    expect(getter).toHaveBeenCalledTimes(1);
  });

  it('should not call getter if item is not stale', async () => {
    const key = 'key1';
    const getter = jest.fn(() => Promise.resolve('data'));

    await cache.get(key, getter);
    await cache.get(key, getter);

    expect(getter).toHaveBeenCalledTimes(1);
  });

  it('should call getter if item is stale', async () => {
    const key = 'key1';
    const getter = jest.fn(() => Promise.resolve('data'));

    await cache.get(key, getter);

    jest.advanceTimersByTime(RequestCache.staleTime + 1);

    await cache.get(key, getter);

    expect(getter).toHaveBeenCalledTimes(2);
  });

  it('should retry after rejection', async () => {
    const key = 'key1';
    const getter = jest.fn(() => Promise.reject('error'));

    try {
      await cache.get(key, getter);
    } catch (error) {
      jest.advanceTimersByTime(RequestCache.retryTime + 1);
      try {
        await cache.get(key, getter);
      } catch (error) {
        expect(getter).toHaveBeenCalledTimes(2);
      }
    }
  });

  it('should respect custom staleTime and retryTime', async () => {
    const key = 'key1';
    const getter = jest.fn(() => Promise.resolve('data'));
    const options = { staleTime: 10000, retryTime: 2000 };

    await cache.get(key, getter, options);

    jest.advanceTimersByTime(10001);

    await cache.get(key, getter);

    expect(getter).toHaveBeenCalledTimes(2);

    getter.mockImplementation(() => Promise.reject('error'));

    try {
      await cache.get(key, getter, options);
    } catch (error) {
      jest.advanceTimersByTime(2001);
      try {
        await cache.get(key, getter, options);
      } catch (error) {
        expect(getter).toHaveBeenCalledTimes(4);
      }
    }
  });

  it('should return the same promise if getter has not resolved yet', async () => {
    const key = 'key1';
    const getter = () =>
      new Promise((resolve) => setTimeout(() => resolve('data'), 5000));

    const promise1 = cache.get(key, getter);
    const promise2 = cache.get(key, getter);

    expect(promise1).toStrictEqual(promise2);
  });

  it('should handle different keys correctly', async () => {
    const key1 = 'key1';
    const key2 = 'key2';
    const getter1 = jest.fn(() => Promise.resolve('data1'));
    const getter2 = jest.fn(() => Promise.resolve('data2'));

    await cache.get(key1, getter1);
    await cache.get(key2, getter2);

    expect(getter1).toHaveBeenCalledTimes(1);
    expect(getter2).toHaveBeenCalledTimes(1);

    await cache.get(key1, getter1);
    await cache.get(key2, getter2);

    expect(getter1).toHaveBeenCalledTimes(1);
    expect(getter2).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(RequestCache.staleTime + 1);

    await cache.get(key1, getter1);
    await cache.get(key2, getter2);

    expect(getter1).toHaveBeenCalledTimes(2);
    expect(getter2).toHaveBeenCalledTimes(2);
  });

  it('should respect a function as staleTime', async () => {
    const key = 'key1';
    const getter = jest.fn(() => Promise.resolve('data'));

    const options = {
      staleTime: (fulfilledCount: number) => fulfilledCount * 10000,
    };

    await cache.get(key, getter, options); // First call to getter

    jest.advanceTimersByTime(9999); // Advance time less than staleTime

    await cache.get(key, getter, options); // Second call to getter

    expect(getter).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(2); // 9999 + 2 = 10001: Advance time more than staleTime for 0 fulfilledCount

    await cache.get(key, getter, options); // Second call to getter

    expect(getter).toHaveBeenCalledTimes(2);

    jest.advanceTimersByTime(20001); // Advance time more than staleTime for 1 fulfilledCount

    await cache.get(key, getter, options); // Third call to getter

    expect(getter).toHaveBeenCalledTimes(3);
  });
});

import { RequestCache } from './request-cache';

jest.useFakeTimers();

const fetchIdentity = (value: string) =>
  new Promise<string>((resolve) => setTimeout(() => resolve(value), 10));

describe.only('request-cache', () => {
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

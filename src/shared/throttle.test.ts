import { throttle } from './throttle';

describe('throttle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  test('invokes immediately and once more with the latest trailing call', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);

    throttled('first');
    expect(fn).toHaveBeenLastCalledWith('first');

    throttled('second');
    throttled('third');
    expect(fn).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith('third');
  });

  test('supports trailing-only invocation', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100, { leading: false });

    throttled('first');
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenLastCalledWith('first');
  });

  test('cancel drops the pending trailing call', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);

    throttled('first');
    throttled('second');
    throttled.cancel();
    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledTimes(1);
  });
});

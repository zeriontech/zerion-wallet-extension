import { memoize } from 'moderndash';

/**
 * Single-entry memoizer with memoize-one semantics, backed by ModernDash's
 * memoize. Only the most recent argument list is retained, and arguments are
 * compared with `===` like memoize-one (not deep equality).
 */
export default function memoizeOne<Args extends unknown[], Result>(
  fn: (...args: Args) => Result,
): (...args: Args) => Result {
  let lastArgs: Args | undefined;
  let cacheKey = 0;
  const memoized = memoize((...args: unknown[]) => fn(...(args as Args)), {
    resolver: (...args: unknown[]) => {
      const isSameCall =
        lastArgs !== undefined &&
        args.length === lastArgs.length &&
        args.every((arg, index) => arg === lastArgs?.[index]);
      if (!isSameCall) {
        lastArgs = args as Args;
        cacheKey += 1;
        memoized.cache.clear();
      }
      return String(cacheKey);
    },
  });
  return memoized as (...args: Args) => Result;
}

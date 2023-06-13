/**
 * Inspired by: https://www.npmjs.com/package/tiny-invariant
 */
export function invariant<T>(
  value: T | null | undefined,
  message: string | (() => Error)
): asserts value is T {
  if (value === false || value == null) {
    if (typeof message === 'function') {
      throw message();
    } else {
      throw new Error(message);
    }
  }
}

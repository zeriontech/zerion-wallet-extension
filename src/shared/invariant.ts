/**
 * Inspired by: https://www.npmjs.com/package/tiny-invariant
 */
export function invariant<T>(
  value: T | false | null | undefined,
  message: string | (() => Error) = 'Assertion failed'
): asserts value {
  if (value === false || value == null) {
    if (typeof message === 'function') {
      throw message();
    } else {
      throw new Error(message);
    }
  }
}

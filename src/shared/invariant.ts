/**
 * Inspired by: https://www.npmjs.com/package/tiny-invariant
 */
export function invariant<T>(
  value: T | null | undefined,
  message: string
): asserts value is T {
  if (value == null) {
    throw new Error(message);
  }
}

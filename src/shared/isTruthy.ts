/**
 * Type guard for values that are neither `null` nor `undefined`.
 * Replaces the single-function `is-truthy-ts` dependency.
 */
export function isTruthy<T>(value: T | undefined | null | void): value is T {
  return value != null;
}

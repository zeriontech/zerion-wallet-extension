/**
 * Uppercases the first character and leaves the rest untouched.
 * Replaces the single-function `capitalize-ts` dependency.
 */
export function capitalize<T extends string>(value: T): Capitalize<T> {
  return (value.charAt(0).toUpperCase() + value.slice(1)) as Capitalize<T>;
}

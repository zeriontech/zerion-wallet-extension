/** Uppercases the first character and leaves the rest untouched. */
export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

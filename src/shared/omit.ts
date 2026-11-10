import { omit as modernOmit } from 'moderndash';

/**
 * ModernDash's omit only accepts keys known to the object type. Several call
 * sites omit optional fields from narrower parameter unions, so keep the same
 * runtime behavior with a permissive key list.
 */
export function omit<T extends object, K extends PropertyKey>(
  object: T,
  keys: readonly K[],
): Omit<T, Extract<keyof T, K>> {
  return modernOmit(object as Record<PropertyKey, unknown>, [...keys] as PropertyKey[]) as Omit<
    T,
    Extract<keyof T, K>
  >;
}

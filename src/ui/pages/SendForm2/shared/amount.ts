import BigNumber from 'bignumber.js';

/**
 * Distinguishes "no amount entered" from a deliberate zero.
 *
 * Zero-value sends are legitimate (calldata claims, approvals, non-payable
 * calls), so `0` must not be conflated with an untouched input. Form state is
 * URL-backed and only persists truthy strings, so an absent value already means
 * the placeholder is showing; on top of that, anything that parses to a number
 * counts as entered (`0`, `0.`, `0.000`), while partial input that isn't a
 * number yet (a lone `.`) does not.
 */
export function isAmountEntered(value: string | null | undefined): boolean {
  if (!value) return false;
  return !new BigNumber(value).isNaN();
}

/** True only for an entered amount that resolves to exactly zero. */
export function isZeroAmount(value: string | null | undefined): boolean {
  if (!isAmountEntered(value)) return false;
  return new BigNumber(value as string).isZero();
}

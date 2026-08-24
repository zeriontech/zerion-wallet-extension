import BigNumber from 'bignumber.js';
import { FLOAT_INPUT_PATTERN } from 'src/ui/shared/forms/inputs';

// eslint-disable-next-line security/detect-non-literal-regexp -- FLOAT_INPUT_PATTERN is a build-time constant, not user input
const ENTERED_AMOUNT_REGEX = new RegExp(`^${FLOAT_INPUT_PATTERN}$`);

/**
 * Distinguishes "no amount entered" from a deliberate zero.
 *
 * Zero-value sends are legitimate (calldata claims, approvals, non-payable
 * calls), so `0` must not be conflated with an untouched input. Form state is
 * URL-backed and only persists truthy strings, so an absent value already means
 * the placeholder is showing; on top of that, anything the amount input allows
 * typing counts as entered (`0`, `0.`, `0.000`), while partial input that
 * isn't a number yet (a lone `.`) does not. Matching the input's own pattern —
 * not a general numeric parse — keeps URL-injected values in other notations
 * (`-1`, `0x0`, `1e3`) from passing the gate.
 */
export function isAmountEntered(value: string | null | undefined): boolean {
  if (!value) return false;
  return ENTERED_AMOUNT_REGEX.test(value);
}

/** True only for an entered amount that resolves to exactly zero. */
export function isZeroAmount(value: string | null | undefined): boolean {
  if (!isAmountEntered(value)) return false;
  return new BigNumber(value as string).isZero();
}

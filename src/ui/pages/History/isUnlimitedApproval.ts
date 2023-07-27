import type BigNumber from 'bignumber.js';

const MAX_APPROVE_NUMBER =
  '115792089237316195423570985008687907853269984665640564039457584007913129639935'; // 2 ** 256 - 1

export function isUnlimitedApproval(
  value?: string | number | BigNumber | null
) {
  return value?.toString() === MAX_APPROVE_NUMBER;
}

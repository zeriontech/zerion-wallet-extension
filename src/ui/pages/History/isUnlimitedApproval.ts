import BigNumber from 'bignumber.js';
import { ethers } from 'ethers';

// 2 ** 256 - 1
export const UNLIMITED_APPROVAL_AMOUNT = new BigNumber(
  ethers.constants.MaxUint256.toString()
);

export function isUnlimitedApproval(value?: BigNumber.Value | null) {
  return new BigNumber(value?.toString() || 0).gte(UNLIMITED_APPROVAL_AMOUNT);
}

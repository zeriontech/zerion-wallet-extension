import BigNumber from 'bignumber.js';
import { ethers } from 'ethers';

// 2 ** 256 - 1
export const UNLIMITED_APPROVAL_AMOUNT = new BigNumber(
  ethers.MaxUint256.toString()
);

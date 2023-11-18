import BigNumber from 'bignumber.js';
import { UNLIMITED_APPROVAL_AMOUNT } from 'src/modules/ethereum/constants';

export function isUnlimitedApproval(value?: BigNumber.Value | null) {
  return new BigNumber(value?.toString() || 0).gte(UNLIMITED_APPROVAL_AMOUNT);
}

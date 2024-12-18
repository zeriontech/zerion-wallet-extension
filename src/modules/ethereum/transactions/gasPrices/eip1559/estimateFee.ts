import type { EIP1559 } from '@zeriontech/transactions';
import BigNumber from 'bignumber.js';

export function estimateFee({
  gas,
  eip1559,
  baseFee,
}: {
  gas: string | number;
  eip1559: EIP1559;
  baseFee: number;
}): BigNumber {
  const intendedFee = baseFee + (eip1559.priorityFee || 0);
  const pricePerUnit = Math.min(intendedFee, eip1559.maxFee);
  return new BigNumber(gas).times(pricePerUnit);
}

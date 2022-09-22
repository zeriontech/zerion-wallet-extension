import type { EIP1559Base } from '../EIP1559';

export function estimateFee({
  gas,
  eip1559Base,
}: {
  gas: string | number;
  eip1559Base: EIP1559Base;
}): number {
  const pricePerUnit = eip1559Base.base_fee + (eip1559Base.priority_fee || 0);
  return Number(gas) * pricePerUnit;
}

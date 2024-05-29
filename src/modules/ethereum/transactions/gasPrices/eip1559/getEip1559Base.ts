import type { EIP1559 } from '@zeriontech/transactions';
import type { EIP1559Base } from '../EIP1559';

export function getEip1559Base(
  eip1559: EIP1559,
  eip1559Info: Pick<EIP1559Base, 'baseFee'>
): EIP1559Base {
  return Object.assign({ baseFee: eip1559Info.baseFee }, eip1559);
}

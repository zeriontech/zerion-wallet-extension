import type { EIP1559, EIP1559Base } from '../EIP1559';
import type { EIP1559GasPrices } from '../requests';

export function getEip1559Base(
  eip1559: EIP1559,
  eip1559Info: Pick<EIP1559GasPrices, 'base_fee'>
): EIP1559Base {
  return Object.assign({ base_fee: eip1559Info.base_fee }, eip1559);
}

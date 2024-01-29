import type { EIP1559 } from '@zeriontech/transactions/lib/shared/user-configuration/types';
import type { EIP1559Base } from './EIP1559';

export interface GasPriceObject {
  classic?: number | string | null;
  eip1559?: EIP1559 | null;
}

export interface GasPriceWithBaseObject {
  classic?: number | string;
  eip1559?: EIP1559Base;
}

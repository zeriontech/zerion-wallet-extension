import type { EIP1559 } from '@zeriontech/transactions';
import type { EIP1559Base } from './EIP1559';

export interface GasPriceObject {
  classic: number | string | null;
  eip1559: EIP1559 | null;
  optimistic: {
    underlying: { classic: number | string | null; eip1559: EIP1559 | null };
  } | null;
}

export interface GasPriceWithBaseObject {
  classic?: number | string;
  eip1559?: EIP1559Base;
}

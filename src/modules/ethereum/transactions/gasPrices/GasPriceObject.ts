import type { EIP1559 } from '@zeriontech/transactions';

export interface GasPriceObject {
  classic: number | string | null;
  eip1559: EIP1559 | null;
  optimistic: {
    underlying: { classic: number | string | null; eip1559: EIP1559 | null };
  } | null;
}

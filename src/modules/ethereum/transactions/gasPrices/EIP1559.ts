import type { EIP1559 } from '@zeriontech/transactions';

export type EIP1559Base = EIP1559 & {
  baseFee: number;
};

import type { EIP1559 } from 'src/shared/types/TransactionConfiguration';

export type EIP1559Base = EIP1559 & {
  baseFee: number;
};

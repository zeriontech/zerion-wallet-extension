import type { EIP1559 } from '@zeriontech/transactions/lib/shared/user-configuration/types';

export type EIP1559Base = EIP1559 & {
  base_fee: number;
};

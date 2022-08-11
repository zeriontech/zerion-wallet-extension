export interface EIP1559 {
  estimation_seconds?: number;
  max_fee: number;
  priority_fee: number;
}

export type EIP1559Base = EIP1559 & {
  base_fee: number;
};

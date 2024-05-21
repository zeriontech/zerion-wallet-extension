import type { EIP1559Base } from './EIP1559';

interface OptimisticGasPrice {
  underlying: {
    classic: number | null;
    eip1559: EIP1559Base | null;
  };
  fixedOverhead: number;
  dynamicOverhead: number;
}

interface SpeedGasPrice {
  classic: number | null;
  eip1559: EIP1559Base | null;
  optimistic: OptimisticGasPrice | null;
  eta: number | null;
}

export interface ChainGasPrice {
  average: SpeedGasPrice;
  fast: SpeedGasPrice;
}

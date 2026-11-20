import type { EIP1559Base } from './EIP1559';

interface OptimisticGasPrice {
  underlying: {
    classic: number | null;
    eip1559: EIP1559Base | null;
  };
  fixedOverhead: number;
  dynamicOverhead: number;
}

export type GasPriceProvenance = {
  /** Newest sampled block the recommendation comes from (WLT-2742). */
  block?: number | null;
  /** Formula part that set the tip: floor | p75 | base | s | cap | fixed. */
  source?: string | null;
};

interface SpeedGasPrice extends GasPriceProvenance {
  classic: number | null;
  eip1559: EIP1559Base | null;
  optimistic: OptimisticGasPrice | null;
  eta: number | null;
}

export interface ChainGasPrice {
  average: SpeedGasPrice;
  fast: SpeedGasPrice;
  /** Gas-service formula version shared by both speeds (WLT-2742). */
  formulaVersion?: string | null;
}

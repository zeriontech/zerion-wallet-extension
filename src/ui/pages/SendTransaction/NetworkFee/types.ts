import type { EIP1559 } from 'src/modules/ethereum/transactions/gasPrices/EIP1559';

export type NetworkFeeSpeed = 'fast' | 'standard' | 'custom';

export interface NetworkFeeConfiguration {
  speed: NetworkFeeSpeed;
  custom1559GasPrice: EIP1559 | null;
  customClassicGasPrice: number | null;
}

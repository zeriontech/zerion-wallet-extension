/**
 * User-facing transaction configuration shared by the send and swap forms.
 * Inlined from `@zeriontech/transactions` (WLT-2470); the shapes are part of
 * persisted form state (`networkFeeSpeed`) and must stay stable.
 */

export interface EIP1559 {
  maxFee: number;
  priorityFee: number;
}

export type NetworkFeeSpeed = 'fast' | 'average' | 'custom';

export interface NetworkFeeConfiguration {
  speed: NetworkFeeSpeed;
  custom1559GasPrice: EIP1559 | null;
  customClassicGasPrice: number | null;
  gasLimit: string | null;
}

export interface CustomConfiguration {
  nonce: string | null;
  slippage: number | null;
  networkFee: NetworkFeeConfiguration;
}

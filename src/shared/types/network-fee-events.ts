import type { NetworkFeeSpeed } from './TransactionConfiguration';

export type NetworkFeeAnalyticsFlow = 'send' | 'swap' | 'dapp';
export type NetworkFeeAnalyticsLevel = 'fast' | 'slow' | 'custom';

export interface NetworkFeeLevelChangedParams {
  level: NetworkFeeAnalyticsLevel;
  chain: string;
  flow: NetworkFeeAnalyticsFlow;
}

export function toNetworkFeeAnalyticsLevel(
  speed: NetworkFeeSpeed
): NetworkFeeAnalyticsLevel {
  return speed === 'average' ? 'slow' : speed;
}

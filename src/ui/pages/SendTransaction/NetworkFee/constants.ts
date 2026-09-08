import type { NetworkFeeSpeed } from 'src/shared/types/TransactionConfiguration';

export const NETWORK_SPEED_TO_TITLE: Record<NetworkFeeSpeed, string> = {
  fast: 'Fast',
  average: 'Average',
  custom: 'Custom',
};

import type { NetworkFeeSpeed } from '@zeriontech/transactions';

export const NETWORK_SPEED_TO_TITLE: Record<NetworkFeeSpeed, string> = {
  fast: 'Fast',
  standard: 'Average',
  custom: 'Custom',
};

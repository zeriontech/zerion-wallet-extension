import type { NetworkFeeSpeed } from 'src/shared/types/TransactionConfiguration';

export const NETWORK_SPEED_TO_TITLE: Record<NetworkFeeSpeed, string> = {
  fast: 'Fast',
  average: 'Slow',
  custom: 'Custom',
};

/** Open point: bashalex/Igor prefer amount-only for Fast; Yura's mock keeps the grey label. */
export const SHOW_FAST_LEVEL_LABEL = true;

export function getNetworkFeeLevelColor(speed: NetworkFeeSpeed): string {
  return speed === 'fast' ? 'var(--neutral-500)' : 'var(--notice-500)';
}

export function shouldShowNetworkFeeLevelLabel(
  speed: NetworkFeeSpeed
): boolean {
  return speed !== 'fast' || SHOW_FAST_LEVEL_LABEL;
}

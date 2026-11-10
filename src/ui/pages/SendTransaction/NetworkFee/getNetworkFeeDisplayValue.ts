import { isTruthy } from 'is-truthy-ts';
import type { NetworkFeeSpeed } from 'src/shared/types/TransactionConfiguration';
import { NETWORK_SPEED_TO_TITLE, SHOW_FAST_LEVEL_LABEL } from './constants';

/**
 * The dapp fee row value. Acceleration flows (`customViewOnly`) keep the
 * pre-existing speed-title prefix. Elsewhere the level is rendered by
 * `NetworkFeeLevelLabel`, so this only returns the amount — except for Fast
 * when the grey Fast label is disabled, which keeps the legacy ETA form.
 */
export function getNetworkFeeDisplayValue({
  speed,
  time,
  feeValueFormatted,
  feeValuePrefix,
  customViewOnly,
}: {
  speed: NetworkFeeSpeed;
  time: string | undefined;
  feeValueFormatted: string | undefined;
  feeValuePrefix: string;
  customViewOnly: boolean;
}): string | null {
  if (!feeValueFormatted) {
    return null;
  }
  const amount = `${feeValuePrefix}${feeValueFormatted}`;
  if (customViewOnly) {
    const speedLabels =
      speed === 'custom'
        ? [time, NETWORK_SPEED_TO_TITLE.custom]
        : [time || NETWORK_SPEED_TO_TITLE[speed]];
    return [...speedLabels, amount].filter(isTruthy).join(' · ');
  }
  if (speed === 'fast' && !SHOW_FAST_LEVEL_LABEL) {
    return [time || NETWORK_SPEED_TO_TITLE.fast, amount].filter(isTruthy).join(' · ');
  }
  return amount;
}

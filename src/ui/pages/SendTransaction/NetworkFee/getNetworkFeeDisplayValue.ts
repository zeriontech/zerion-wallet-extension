import { isTruthy } from 'is-truthy-ts';
import type { NetworkFeeSpeed } from 'src/shared/types/TransactionConfiguration';
import { NETWORK_SPEED_TO_TITLE } from './constants';

/** Acceleration flows own their fee UI and must keep the old behaviour. */
export function shouldShowNetworkFeeReminder(customViewOnly: boolean): boolean {
  return !customViewOnly;
}

/**
 * The dapp fee row value. Acceleration flows (`customViewOnly`) keep the
 * pre-existing speed-title prefix; the preference reminder is not shown there.
 * Elsewhere the reminder carries the speed wording, so non-Fast rows show only
 * the ETA and amount.
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
  const speedLabels = customViewOnly
    ? speed === 'custom'
      ? [time, NETWORK_SPEED_TO_TITLE.custom]
      : [time || NETWORK_SPEED_TO_TITLE[speed]]
    : speed === 'fast'
    ? [time || NETWORK_SPEED_TO_TITLE.fast]
    : [time];
  return [...speedLabels, `${feeValuePrefix}${feeValueFormatted}`]
    .filter(isTruthy)
    .join(' · ');
}

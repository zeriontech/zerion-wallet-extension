import type { NetworkFeeSpeed } from 'src/shared/types/TransactionConfiguration';

// Copy is shared with iOS/Android; keep the strings aligned when design updates them.

/** Fee-row hint shown whenever the effective level is not Fast. */
export function getNetworkFeeIndicator(speed: NetworkFeeSpeed): string | null {
  if (speed === 'average') {
    return 'Average fee selected (your last choice)';
  }
  if (speed === 'custom') {
    return 'Custom fee selected (kept for 24 hours)';
  }
  return null;
}

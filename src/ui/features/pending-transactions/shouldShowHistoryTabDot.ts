import type { PendingAction } from 'src/modules/zerion-api/requests/wallet-get-actions';
import { countSignablePendingActions } from './countSignablePendingActions';

export function shouldShowHistoryTabDot({
  isWatchlist,
  localPendingCount,
  unsigned,
  nowMs,
}: {
  isWatchlist: boolean;
  localPendingCount: number;
  unsigned: PendingAction[];
  nowMs: number;
}): boolean {
  if (isWatchlist) {
    return false;
  }
  return (
    localPendingCount > 0 || countSignablePendingActions(unsigned, nowMs) > 0
  );
}

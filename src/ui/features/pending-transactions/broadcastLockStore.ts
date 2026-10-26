import { Store } from 'store-unit';
import type { PendingAction } from 'src/modules/zerion-api/requests/wallet-get-actions';
import { hidePendingAction, unhidePendingAction } from './hiddenPendingActions';
import { getRowTransactions } from './mergePendingEntries';

/** The pendingActionIds the wallet broadcast and the backend has not listed with a hash yet */
export const broadcastLockStore = new Store<ReadonlySet<string>>(new Set());

/** Hides a just-broadcast row until the backend's pending list carries a hash for it or the row is gone */
export function lockBroadcastRow(pendingActionId: string): void {
  hidePendingAction(pendingActionId);
  broadcastLockStore.setState(
    new Set([...broadcastLockStore.getState(), pendingActionId])
  );
}

function release(pendingActionIds: string[]) {
  if (!pendingActionIds.length) {
    return;
  }
  const next = new Set(broadcastLockStore.getState());
  for (const id of pendingActionIds) {
    next.delete(id);
    unhidePendingAction(id);
  }
  broadcastLockStore.setState(next);
}

/**
 * Releases the locks the backend has caught up with. A row still in `unsigned`
 * or in `pending` with no hash stays hidden; once it carries a hash it shows
 * again, and a row with the broadcast hash takes the local transaction's place
 * instead of adding a second one.
 */
export function reconcileBroadcastLocks({
  pending,
  unsigned,
}: {
  pending: PendingAction[];
  unsigned: PendingAction[];
}): void {
  const released: string[] = [];
  for (const id of broadcastLockStore.getState()) {
    if (unsigned.some((row) => row.pendingActionId === id)) {
      continue;
    }
    const row = pending.find((row) => row.pendingActionId === id);
    if (!row) {
      released.push(id);
      continue;
    }
    if (getRowTransactions(row).some((transaction) => transaction.hash)) {
      released.push(id);
    }
  }
  release(released);
}

/** What a broadcast or a dismiss does to History: the row disappears at once and History refetches */
export function createPendingRowEffects(refetch: () => void) {
  return {
    onBroadcast(item: PendingAction) {
      lockBroadcastRow(item.pendingActionId);
      refetch();
    },
    onDismissed(item: PendingAction) {
      hidePendingAction(item.pendingActionId);
      refetch();
    },
  };
}

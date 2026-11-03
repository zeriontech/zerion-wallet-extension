import { beforeEach, describe, expect, it } from '@jest/globals';
import type { PendingAction } from 'src/modules/zerion-api/requests/wallet-get-actions';
import type { QueueEvent } from 'src/ui/components/TransactionSigner/types';
import { mergeHistoryActions } from 'src/ui/pages/History/mergeHistoryActions';
import { mockStoreUnit } from './mockStoreUnit';
import {
  NOW_MS,
  evmBuildResult,
  evmPendingRow,
  evmReadyRow,
} from './signPendingAction.fixtures';

mockStoreUnit();
const { hiddenPendingActionsStore } = await import('./hiddenPendingActions');
const { broadcastLockStore, createPendingRowEffects, reconcileBroadcastLocks } =
  await import('./broadcastLockStore');
const { createSignLock } = await import('./signLock');
const { signPendingAction } = await import('./signPendingAction');

const BROADCAST_HASH = `0x${'ab'.repeat(32)}`;
const REPLACEMENT_HASH = `0x${'ef'.repeat(32)}`;

const ROW = evmReadyRow();
const ID = ROW.pendingActionId;

/** The local History row TransactionService adds for the wallet-sent transaction */
const LOCAL_TRANSACTION = {
  id: 'local-1',
  timestamp: NOW_MS,
  status: 'pending' as const,
  transaction: { hash: BROADCAST_HASH, chain: { id: 'base' } },
  acts: null,
};

function isHidden() {
  return hiddenPendingActionsStore.getState().has(ID);
}

function visiblePendingEntries(lists: {
  pending: PendingAction[];
  unsigned: PendingAction[];
}) {
  return mergeHistoryActions({
    local: [LOCAL_TRANSACTION],
    actions: [],
    ...lists,
    hiddenIds: hiddenPendingActionsStore.getState(),
    filters: {},
    contentFiltered: false,
  }).pending;
}

describe('hidden pending rows after Sign and Dismiss', () => {
  let refetchCount: number;
  let effects: ReturnType<typeof createPendingRowEffects>;

  beforeEach(() => {
    hiddenPendingActionsStore.setState(new Set());
    broadcastLockStore.setState(new Set());
    refetchCount = 0;
    effects = createPendingRowEffects(() => {
      refetchCount += 1;
    });
  });

  async function broadcast() {
    let emit: (event: QueueEvent) => void = () => null;
    const action = signPendingAction(ROW, {
      lock: createSignLock(),
      nowMs: () => NOW_MS,
      initiator: 'chrome-extension://extension-id',
      buildAction: async () => evmBuildResult(),
      review: async () => true,
      enqueue: (_steps, { onEvent }) => {
        emit = onEvent;
        return { promise: new Promise(() => null) };
      },
      onBroadcast: effects.onBroadcast,
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(isHidden()).toBe(false);
    emit({ type: 'step-signing', index: 0 });
    expect(isHidden()).toBe(false);
    emit({ type: 'step-pending', index: 0, txHash: BROADCAST_HASH });
    await action;
  }

  it('hides a broadcast row at once and refetches History', async () => {
    await broadcast();
    expect(isHidden()).toBe(true);
    expect(refetchCount).toBe(1);
    expect(visiblePendingEntries({ pending: [], unsigned: [ROW] })).toEqual([
      { kind: 'local', action: LOCAL_TRANSACTION },
    ]);
  });

  it('keeps the row hidden while the backend still lists it unsigned or without a hash', async () => {
    await broadcast();

    reconcileBroadcastLocks({ pending: [], unsigned: [ROW] });
    expect(isHidden()).toBe(true);

    reconcileBroadcastLocks({ pending: [evmPendingRow(ID, '')], unsigned: [] });
    expect(isHidden()).toBe(true);
    expect(broadcastLockStore.getState().has(ID)).toBe(true);
  });

  it('shows no second row once the backend lists the broadcast hash', async () => {
    await broadcast();
    const lists = {
      pending: [evmPendingRow(ID, BROADCAST_HASH)],
      unsigned: [],
    };

    reconcileBroadcastLocks(lists);

    expect(broadcastLockStore.getState().has(ID)).toBe(false);
    const entries = visiblePendingEntries(lists);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toEqual(
      expect.objectContaining({
        kind: 'remote',
        item: expect.objectContaining({ pendingActionId: ID }),
      })
    );
  });

  it('shows the row again when the backend lists it under a different hash', async () => {
    await broadcast();
    const lists = {
      pending: [evmPendingRow(ID, REPLACEMENT_HASH)],
      unsigned: [],
    };

    reconcileBroadcastLocks(lists);

    expect(isHidden()).toBe(false);
    expect(visiblePendingEntries(lists)).toEqual([
      { kind: 'local', action: LOCAL_TRANSACTION },
      expect.objectContaining({ kind: 'remote' }),
    ]);
  });

  it('releases the lock when the row is gone from both lists', async () => {
    await broadcast();
    reconcileBroadcastLocks({ pending: [], unsigned: [] });
    expect(broadcastLockStore.getState().size).toBe(0);
  });

  it('hides a dismissed row for good and refetches History', () => {
    effects.onDismissed(ROW);

    expect(isHidden()).toBe(true);
    expect(refetchCount).toBe(1);
    reconcileBroadcastLocks({ pending: [], unsigned: [ROW] });
    reconcileBroadcastLocks({ pending: [], unsigned: [] });
    expect(isHidden()).toBe(true);
    expect(visiblePendingEntries({ pending: [], unsigned: [ROW] })).toEqual([
      { kind: 'local', action: LOCAL_TRANSACTION },
    ]);
  });
});

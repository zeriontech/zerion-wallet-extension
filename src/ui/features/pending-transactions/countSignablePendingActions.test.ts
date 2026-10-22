import { describe, expect, it } from '@jest/globals';
import type {
  PendingActionStatus,
  PendingActionWire,
} from 'src/modules/zerion-api/requests/wallet-get-actions';
import {
  PENDING_ACTION_STATUSES,
  normalizePendingList,
} from 'src/modules/zerion-api/requests/wallet-get-actions-pending.normalize';
import { createFakePendingLists } from './fakePendingActions';
import { countSignablePendingActions } from './countSignablePendingActions';

const NOW_SECONDS = 1791295200;
const NOW_MS = NOW_SECONDS * 1000;
const ADDRESS = '0x42b9df65b219b3dd36ff330a4dd8f327a6ada990';

// Wire row shape per zpi-ref main PendingAction.yaml / PendingAct.yaml; availableAt is set after normalizing because whole wire seconds cannot express nowMs ± 1.
function pendingAction(list: PendingActionStatus, availableAt: number | null) {
  const wire: PendingActionWire = {
    address: ADDRESS,
    id: '0b5e1c7d9a2f4e6b8c3d5f7a9e1b3c5d',
    timestamp: NOW_SECONDS - 600,
    status: null,
    type: { value: 'send', displayValue: 'Send' },
    label: null,
    fee: null,
    refund: null,
    transaction: null,
    acts: [
      {
        type: { value: 'send', displayValue: 'Send' },
        label: null,
        content: { transfers: null, approvals: null },
        rate: null,
        status: '',
        transaction: {
          chain: { id: 'base', name: 'Base', iconUrl: null },
          hash: '',
          explorerUrl: null,
        },
      },
    ],
    content: { transfers: null, approvals: null },
  };
  const [item] = normalizePendingList([wire], list);
  return { ...item, availableAt };
}

const AVAILABLE_AT = {
  null: null,
  'nowMs - 1': NOW_MS - 1,
  nowMs: NOW_MS,
  'nowMs + 1': NOW_MS + 1,
} as const;

const SIGNABLE: Record<
  PendingActionStatus,
  Record<keyof typeof AVAILABLE_AT, boolean>
> = {
  pending: {
    null: false,
    'nowMs - 1': false,
    nowMs: false,
    'nowMs + 1': false,
  },
  unsigned: {
    null: false,
    'nowMs - 1': true,
    nowMs: true,
    'nowMs + 1': false,
  },
};

const CROSS = PENDING_ACTION_STATUSES.flatMap((status) =>
  (Object.keys(AVAILABLE_AT) as (keyof typeof AVAILABLE_AT)[]).map(
    (availableAtCase) => [status, availableAtCase] as const
  )
);

describe('countSignablePendingActions', () => {
  it.each(CROSS)('status %j, availableAt %j', (status, availableAtCase) => {
    const item = pendingAction(status, AVAILABLE_AT[availableAtCase]);
    expect(countSignablePendingActions([item], NOW_MS)).toBe(
      SIGNABLE[status][availableAtCase] ? 1 : 0
    );
  });

  it('is 0 for an empty list', () => {
    expect(countSignablePendingActions([], NOW_MS)).toBe(0);
  });

  it('is 1 for a mixed list where only the last item qualifies', () => {
    const lists = createFakePendingLists(ADDRESS, NOW_MS);
    const mixed = [
      ...normalizePendingList(lists.pending, 'pending'),
      ...normalizePendingList(lists.unsigned, 'unsigned'),
    ];
    expect(mixed.at(-1)?.id).toBe('fake-6');
    expect(countSignablePendingActions(mixed.slice(0, -1), NOW_MS)).toBe(0);
    expect(countSignablePendingActions(mixed, NOW_MS)).toBe(1);
  });

  it('counts every qualifying item, skipping the ones that are not ready', () => {
    const ready = pendingAction('unsigned', NOW_MS);
    const notReady = pendingAction('unsigned', NOW_MS + 1);
    expect(
      countSignablePendingActions(
        [ready, notReady, ready, pendingAction('pending', NOW_MS), ready],
        NOW_MS
      )
    ).toBe(3);
  });
});

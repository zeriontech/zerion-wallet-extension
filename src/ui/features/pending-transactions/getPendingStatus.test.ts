import { describe, expect, it } from '@jest/globals';
import type {
  PendingActionStatus,
  PendingActionWire,
} from 'src/modules/zerion-api/requests/wallet-get-actions';
import {
  PENDING_ACTION_STATUSES,
  normalizePendingList,
} from 'src/modules/zerion-api/requests/wallet-get-actions-pending.normalize';
import { getPendingStatus, type PendingStatus } from './getPendingStatus';

const NOW_SECONDS = 1791295200;
const NOW_MS = NOW_SECONDS * 1000;
const FIRST_HASH = `0x${'1'.repeat(64)}`;
const SECOND_HASH = `0x${'2'.repeat(64)}`;

const base = {
  id: 'base',
  name: 'Base',
  iconUrl: 'https://chain-icons.s3.amazonaws.com/base.png',
};

// Wire row shape per zpi-ref main PendingAction.yaml / PendingAct.yaml: status null, act status '', explorerUrl null when hash is ''.
function wireAct(hash: string): PendingActionWire['acts'][number] {
  return {
    type: { value: 'send', displayValue: 'Send' },
    label: null,
    content: { transfers: null, approvals: null },
    rate: null,
    status: '',
    transaction: {
      chain: base,
      hash,
      explorerUrl: hash ? `https://basescan.org/tx/${hash}` : null,
    },
  };
}

function pendingAction(
  list: PendingActionStatus,
  hashes: string[],
  availableAtSeconds: number | undefined
) {
  const wire: PendingActionWire = {
    address: '0x42b9df65b219b3dd36ff330a4dd8f327a6ada990',
    id: '0b5e1c7d9a2f4e6b8c3d5f7a9e1b3c5d',
    timestamp: NOW_SECONDS - 600,
    status: null,
    type: { value: 'send', displayValue: 'Send' },
    label: null,
    fee: null,
    refund: null,
    transaction: null,
    acts: hashes.map(wireAct),
    content: { transfers: null, approvals: null },
    ...(availableAtSeconds === undefined
      ? {}
      : { availableAt: availableAtSeconds }),
  };
  const [item] = normalizePendingList([wire], list);
  return item;
}

type HashCase = 'allEmpty' | 'oneNonEmpty';
type AvailableAtCase = 'null' | 'past' | 'now' | 'future';

const HASHES: Record<HashCase, string[]> = {
  allEmpty: ['', ''],
  oneNonEmpty: ['', FIRST_HASH],
};

const AVAILABLE_AT_SECONDS: Record<AvailableAtCase, number | undefined> = {
  null: undefined,
  past: NOW_SECONDS - 60,
  now: NOW_SECONDS,
  future: NOW_SECONDS + 7200,
};

const EXPECTED: Record<
  PendingActionStatus,
  Record<HashCase, Record<AvailableAtCase, PendingStatus>>
> = {
  pending: {
    allEmpty: {
      null: { kind: 'inProgress' },
      past: { kind: 'inProgress' },
      now: { kind: 'inProgress' },
      future: { kind: 'inProgress' },
    },
    oneNonEmpty: {
      null: { kind: 'broadcasted', hash: FIRST_HASH },
      past: { kind: 'broadcasted', hash: FIRST_HASH },
      now: { kind: 'broadcasted', hash: FIRST_HASH },
      future: { kind: 'broadcasted', hash: FIRST_HASH },
    },
  },
  unsigned: {
    allEmpty: {
      null: { kind: 'notReadyYet' },
      past: { kind: 'readyToSign' },
      now: { kind: 'readyToSign' },
      future: { kind: 'readyIn', readyAt: 1791302400000 },
    },
    oneNonEmpty: {
      null: { kind: 'notReadyYet' },
      past: { kind: 'readyToSign' },
      now: { kind: 'readyToSign' },
      future: { kind: 'readyIn', readyAt: 1791302400000 },
    },
  },
};

const CROSS = PENDING_ACTION_STATUSES.flatMap((status) =>
  (Object.keys(HASHES) as HashCase[]).flatMap((hashCase) =>
    (Object.keys(AVAILABLE_AT_SECONDS) as AvailableAtCase[]).map(
      (availableAtCase) => [status, hashCase, availableAtCase] as const
    )
  )
);

describe('getPendingStatus', () => {
  it.each(CROSS)(
    'status %j, hashes %j, availableAt %j',
    (status, hashCase, availableAtCase) => {
      const item = pendingAction(
        status,
        HASHES[hashCase],
        AVAILABLE_AT_SECONDS[availableAtCase]
      );
      expect(getPendingStatus(item, NOW_MS)).toStrictEqual(
        EXPECTED[status]?.[hashCase][availableAtCase]
      );
    }
  );

  it('availableAt exactly nowMs is readyToSign', () => {
    const item = pendingAction('unsigned', [''], NOW_SECONDS);
    expect(item.availableAt).toBe(NOW_MS);
    expect(getPendingStatus(item, NOW_MS)).toStrictEqual({
      kind: 'readyToSign',
    });
  });

  it('broadcasted hash is the first non-empty act hash', () => {
    const item = pendingAction(
      'pending',
      ['', SECOND_HASH, FIRST_HASH],
      undefined
    );
    expect(getPendingStatus(item, NOW_MS)).toStrictEqual({
      kind: 'broadcasted',
      hash: SECOND_HASH,
    });
  });
});

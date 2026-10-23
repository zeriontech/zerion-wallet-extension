import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import type { PendingActionWire } from 'src/modules/zerion-api/requests/wallet-get-actions';
import { normalizePendingList } from 'src/modules/zerion-api/requests/wallet-get-actions-pending.normalize';
import { getPendingStatusLabel } from './getPendingStatusLabel';
import { armReadyClock, getNextReadyDelay } from './readyClock';

const NOW_SECONDS = 1791295200;
const NOW_MS = NOW_SECONDS * 1000;
const AVAILABLE_AT_S = NOW_SECONDS + 2 * 3600;
const AVAILABLE_AT_MS = AVAILABLE_AT_S * 1000;
const BROADCAST_HASH = `0x${'3'.repeat(64)}`;

// Wire row shape per zpi-ref main PendingAction.yaml / PendingAct.yaml.
function row(
  list: 'pending' | 'unsigned',
  {
    availableAt,
    hash = '',
  }: { availableAt?: number | null; hash?: string } = {}
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
    content: null,
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
          hash,
          explorerUrl: null,
        },
      },
    ],
    ...(availableAt === undefined ? {} : { availableAt }),
  };
  const [item] = normalizePendingList([wire], list);
  return item;
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(NOW_MS);
});

afterEach(() => {
  jest.useRealTimers();
});

describe('readiness line (AC8)', () => {
  const item = row('unsigned', { availableAt: AVAILABLE_AT_S });

  it.each([
    [AVAILABLE_AT_MS - 2 * 3600_000, 'Ready to sign in 2 hours'],
    [AVAILABLE_AT_MS - 1, 'Ready to sign in a few seconds'],
    [AVAILABLE_AT_MS, 'Ready to sign'],
    [AVAILABLE_AT_MS + 1, 'Ready to sign'],
  ])('at %i reads %j', (nowMs, label) => {
    expect(getPendingStatusLabel(item, nowMs)).toBe(label);
  });

  it.each([
    [AVAILABLE_AT_MS - 1, 1],
    [AVAILABLE_AT_MS, null],
    [AVAILABLE_AT_MS + 1, null],
  ])('getNextReadyDelay at %i is %p', (nowMs, delay) => {
    expect(getNextReadyDelay([item], nowMs)).toBe(delay);
  });

  it('switches to "Ready to sign" when the clock armed before availableAt fires, with no refetch', () => {
    let renderedAt = Date.now();
    const rerender = jest.fn(() => {
      renderedAt = Date.now();
    });
    const disarm = armReadyClock([item], renderedAt, rerender);
    expect(getPendingStatusLabel(item, renderedAt)).toBe(
      'Ready to sign in 2 hours'
    );

    jest.advanceTimersByTime(AVAILABLE_AT_MS - NOW_MS - 1);
    expect(rerender).not.toHaveBeenCalled();
    expect(getPendingStatusLabel(item, renderedAt)).toBe(
      'Ready to sign in 2 hours'
    );

    jest.advanceTimersByTime(1);
    expect(rerender).toHaveBeenCalledTimes(1);
    expect(renderedAt).toBe(AVAILABLE_AT_MS);
    expect(getPendingStatusLabel(item, renderedAt)).toBe('Ready to sign');
    disarm();
  });

  it('labels the other statuses', () => {
    expect(
      getPendingStatusLabel(row('unsigned', { availableAt: null }), NOW_MS)
    ).toBe('Not ready yet');
    expect(getPendingStatusLabel(row('pending'), NOW_MS)).toBe('Pending');
    expect(
      getPendingStatusLabel(row('pending', { hash: BROADCAST_HASH }), NOW_MS)
    ).toBe('Pending');
  });
});

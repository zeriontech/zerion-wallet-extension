import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import type { PendingAction } from 'src/modules/zerion-api/requests/wallet-get-actions';
import {
  PENDING_ACTION_STATUSES,
  normalizePendingList,
} from 'src/modules/zerion-api/requests/wallet-get-actions-pending.normalize';
import { createFakePendingLists } from './fakePendingActions';
import { getPendingStatus } from './getPendingStatus';
import {
  armReadyClock,
  getNextReadyDelay,
  watchReadyClock,
} from './readyClock';

const EVM_ADDRESS = '0x42b9df65b219b3dd36ff330a4dd8f327a6ada990';
const NOW_MS = 1791295200 * 1000;

const [UNSIGNED_ROW] = normalizePendingList(
  createFakePendingLists(EVM_ADDRESS, NOW_MS).unsigned,
  'unsigned'
);

function unsignedAt(availableAt: number | null): PendingAction {
  return { ...UNSIGNED_ROW, availableAt };
}

function permutations<T>(items: T[]): T[][] {
  if (items.length <= 1) {
    return [items];
  }
  return items.flatMap((item, index) =>
    permutations([...items.slice(0, index), ...items.slice(index + 1)]).map(
      (rest) => [item, ...rest]
    )
  );
}

describe('getNextReadyDelay', () => {
  it.each([
    ['none', [] as (number | null)[], null],
    ['past-only', [null, NOW_MS - 60_000, NOW_MS - 1], null],
    ['exactly-now', [NOW_MS], null],
    ['beyond-clamp', [NOW_MS + 2 ** 31 + 5], 2_147_483_647],
    ['at-clamp', [NOW_MS + 2_147_483_647], 2_147_483_647],
  ])('%s', (_, availableAts, expected) => {
    expect(getNextReadyDelay(availableAts.map(unsignedAt), NOW_MS)).toBe(
      expected
    );
  });

  it('mixed: 1_000 for every permutation of the five items', () => {
    const items = [
      null,
      NOW_MS - 1,
      NOW_MS,
      NOW_MS + 5_000,
      NOW_MS + 1_000,
    ].map(unsignedAt);
    const orders = permutations(items);
    expect(orders).toHaveLength(120);
    for (const order of orders) {
      expect(getNextReadyDelay(order, NOW_MS)).toBe(1_000);
    }
  });

  it.each(PENDING_ACTION_STATUSES)('status %j at nowMs + 1_000', (status) => {
    const item = { ...unsignedAt(NOW_MS + 1_000), status };
    expect(getNextReadyDelay([item], NOW_MS)).toBe(
      status === 'unsigned' ? 1_000 : null
    );
  });
});

describe('armReadyClock', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('keeps one timer, fires once at the earliest deadline, re-arms for the next', () => {
    const start = Date.now();
    const unsigned = [unsignedAt(start + 1_000), unsignedAt(start + 5_000)];
    const onTick = jest.fn();

    armReadyClock(unsigned, Date.now(), onTick);
    expect(jest.getTimerCount()).toBe(1);

    jest.advanceTimersByTime(999);
    expect(onTick).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    expect(onTick).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(3_999);
    expect(onTick).toHaveBeenCalledTimes(1);

    armReadyClock(unsigned, Date.now(), onTick);
    expect(jest.getTimerCount()).toBe(1);
    jest.advanceTimersByTime(0);
    expect(onTick).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(1);
    expect(onTick).toHaveBeenCalledTimes(2);
    expect(Date.now()).toBe(start + 5_000);

    armReadyClock(unsigned, Date.now(), onTick);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('cleanup before a deadline cancels the timer', () => {
    const onTick = jest.fn();
    const cleanup = armReadyClock(
      [unsignedAt(Date.now() + 1_000)],
      Date.now(),
      onTick
    );
    cleanup();
    jest.advanceTimersByTime(10_000);
    expect(onTick).not.toHaveBeenCalled();
    expect(jest.getTimerCount()).toBe(0);
  });

  it('a stale clock fires immediately', () => {
    const onTick = jest.fn();
    armReadyClock([unsignedAt(Date.now() - 1_000)], Date.now() - 2_000, onTick);
    expect(onTick).not.toHaveBeenCalled();
    jest.advanceTimersByTime(0);
    expect(onTick).toHaveBeenCalledTimes(1);
  });
});

const HOUR_MS = 3_600_000;

describe('watchReadyClock', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it.each([
    ['a step 3 h from ready', [3 * HOUR_MS]],
    ['an empty list', []],
  ])('a new list identity resamples a stale clock: %s', (_, offsets) => {
    const start = Date.now();
    const makeList = () => offsets.map((offset) => unsignedAt(start + offset));
    let nowMs = start;
    const onSample = (sampledMs: number) => {
      nowMs = sampledMs;
    };

    const unwatch = watchReadyClock(makeList(), onSample);
    jest.setSystemTime(start + 1_500_017);
    expect(nowMs).toBe(start);

    unwatch();
    watchReadyClock(makeList(), onSample);
    expect(nowMs).toBe(start + 1_500_017);
  });

  it('samples every 60_000 ms on one interval while a step is 3 h from ready', () => {
    const setIntervalSpy = jest.spyOn(globalThis, 'setInterval');
    const start = Date.now();
    const samples: number[] = [];

    watchReadyClock([unsignedAt(start + 3 * HOUR_MS)], (sampledMs) =>
      samples.push(sampledMs)
    );
    jest.advanceTimersByTime(180_000);

    expect(samples).toEqual([
      start,
      start + 60_000,
      start + 120_000,
      start + 180_000,
    ]);
    expect(setIntervalSpy).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['an empty list', [] as (number | null)[]],
    ['ready-only steps', [-60_000, 0]],
    ['a step without availableAt', [null]],
  ])('no tick for %s', (_, offsets) => {
    const setTimeoutSpy = jest.spyOn(globalThis, 'setTimeout');
    const setIntervalSpy = jest.spyOn(globalThis, 'setInterval');
    const start = Date.now();
    const samples: number[] = [];

    watchReadyClock(
      offsets.map((offset) =>
        unsignedAt(offset === null ? null : start + offset)
      ),
      (sampledMs) => samples.push(sampledMs)
    );
    expect(jest.getTimerCount()).toBe(0);
    jest.advanceTimersByTime(10 * 60_000);

    expect(samples).toEqual([start]);
    expect(setTimeoutSpy).not.toHaveBeenCalled();
    expect(setIntervalSpy).not.toHaveBeenCalled();
  });

  it('unmount clears the interval', () => {
    const clearIntervalSpy = jest.spyOn(globalThis, 'clearInterval');
    const start = Date.now();
    const samples: number[] = [];

    const unwatch = watchReadyClock(
      [unsignedAt(start + 3 * HOUR_MS)],
      (sampledMs) => samples.push(sampledMs)
    );
    jest.advanceTimersByTime(60_000);
    unwatch();

    expect(clearIntervalSpy).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBe(0);
    jest.advanceTimersByTime(10 * 60_000);
    expect(samples).toEqual([start, start + 60_000]);
  });

  it('stops at the first tick that finds no step left pending', () => {
    const start = Date.now();
    const samples: number[] = [];

    watchReadyClock([unsignedAt(start + 90_000)], (sampledMs) =>
      samples.push(sampledMs)
    );
    jest.advanceTimersByTime(120_000);

    expect(samples).toEqual([start, start + 60_000]);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('with the exact timer, the switch to ready lands on availableAt, not on a minute tick', () => {
    const start = Date.now();
    const item = unsignedAt(start + 90_500);
    const unsigned = [item];
    let nowMs = start;
    let disarm = () => {};
    const setNowMs = (sampledMs: number) => {
      nowMs = sampledMs;
      disarm();
      disarm = armReadyClock(unsigned, nowMs, () => setNowMs(Date.now()));
    };

    watchReadyClock(unsigned, setNowMs);
    jest.advanceTimersByTime(90_499);
    expect(nowMs).toBe(start + 60_000);
    expect(getPendingStatus(item, nowMs).kind).toBe('readyIn');

    jest.advanceTimersByTime(1);
    expect(nowMs).toBe(start + 90_500);
    expect(getPendingStatus(item, nowMs).kind).toBe('readyToSign');
  });
});

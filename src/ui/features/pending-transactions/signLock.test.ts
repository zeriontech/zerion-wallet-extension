import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import type { QueueEvent } from 'src/ui/components/TransactionSigner/types';
import { mockStoreUnit } from './mockStoreUnit';
import {
  NOW_MS,
  evmBuildResult,
  evmReadyRow,
} from './signPendingAction.fixtures';
import type { SignLock } from './signLock';

mockStoreUnit();
const {
  SIGN_LOCK_TIMEOUT_MS,
  SignLockBusyError,
  SignLockTimeoutError,
  createSignLock,
} = await import('./signLock');
const { signPendingAction } = await import('./signPendingAction');
const { dismissPendingAction } = await import('./dismissPendingAction');

const HASH = `0x${'cd'.repeat(32)}`;

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/** Lets pending promise callbacks run without moving the fake clock */
async function flush() {
  for (let i = 0; i < 10; i++) {
    await Promise.resolve();
  }
}

type Controls = {
  review: ReturnType<typeof deferred<boolean>>;
  confirm: ReturnType<typeof deferred<string | null>>;
  dismissAction: ReturnType<typeof deferred<unknown>>;
  emit: (event: QueueEvent) => void;
};

function startSign(lock: SignLock, controls: Controls, id?: string) {
  return signPendingAction(evmReadyRow({ id }), {
    lock,
    nowMs: () => NOW_MS,
    initiator: 'chrome-extension://extension-id',
    buildAction: async () => evmBuildResult(),
    review: () => controls.review.promise,
    enqueue: (_steps, { onEvent }) => {
      controls.emit = onEvent;
      return { promise: new Promise(() => null) };
    },
    onBroadcast: () => null,
  });
}

function startDismiss(lock: SignLock, controls: Controls) {
  return dismissPendingAction(evmReadyRow(), {
    lock,
    nowMs: () => NOW_MS,
    confirmAndSign: () => controls.confirm.promise,
    dismissAction: () => controls.dismissAction.promise,
    onDismissed: () => null,
  });
}

type Start = (lock: SignLock, controls: Controls) => Promise<unknown>;

const ENDINGS: Array<{
  name: string;
  start: Start;
  end(controls: Controls): Promise<void>;
  outcome: 'resolves' | 'rejects';
}> = [
  {
    name: 'broadcast',
    start: startSign,
    end: async (controls) => {
      controls.review.resolve(true);
      await flush();
      controls.emit({ type: 'step-pending', index: 0, txHash: HASH });
    },
    outcome: 'resolves',
  },
  {
    name: 'signing error',
    start: startSign,
    end: async (controls) => {
      controls.review.resolve(true);
      await flush();
      controls.emit({
        type: 'step-error',
        index: 0,
        error: new Error('insufficient funds for gas'),
      });
    },
    outcome: 'rejects',
  },
  {
    name: 'review Cancel',
    start: startSign,
    end: async (controls) => controls.review.resolve(false),
    outcome: 'resolves',
  },
  {
    name: 'Dismiss dialog Cancel',
    start: startDismiss,
    end: async (controls) => controls.confirm.resolve(null),
    outcome: 'resolves',
  },
  {
    name: 'device rejection',
    start: startSign,
    end: async (controls) => {
      controls.review.resolve(true);
      await flush();
      controls.emit({
        type: 'queue-aborted',
        reason: 'user-dismissed',
        index: 0,
      });
    },
    outcome: 'resolves',
  },
  {
    name: 'dismiss-action API error',
    start: startDismiss,
    end: async (controls) => {
      controls.confirm.resolve(`0x${'1b'.repeat(65)}`);
      await flush();
      controls.dismissAction.reject(new Error('HTTP 400'));
    },
    outcome: 'rejects',
  },
];

describe('sign lock', () => {
  let lock: SignLock;
  let controls: Controls;

  beforeEach(() => {
    jest.useFakeTimers();
    lock = createSignLock();
    controls = {
      review: deferred<boolean>(),
      confirm: deferred<string | null>(),
      dismissAction: deferred<unknown>(),
      emit: () => {
        throw new Error('nothing enqueued');
      },
    };
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  async function expectConcurrentStartRefused() {
    const other = {
      ...controls,
      review: deferred<boolean>(),
    };
    await expect(startSign(lock, other, 'another-row')).rejects.toBeInstanceOf(
      SignLockBusyError
    );
  }

  it.each(ENDINGS)(
    'releases on $name and refuses a concurrent start while held',
    async ({ start, end, outcome }) => {
      const action = start(lock, controls);
      action.catch(() => null);
      await flush();

      expect(lock.store.getState()).toEqual(
        expect.objectContaining({
          pendingActionId: evmReadyRow().pendingActionId,
        })
      );
      await expectConcurrentStartRefused();

      await end(controls);
      await flush();

      expect(lock.store.getState()).toBeNull();
      if (outcome === 'resolves') {
        await expect(action).resolves.toBeDefined();
      } else {
        await expect(action).rejects.toBeInstanceOf(Error);
      }
      expect(
        lock.acquire({ pendingActionId: 'next', kind: 'sign' })
      ).not.toBeNull();
    }
  );

  it.each<{ name: string; start: Start }>([
    { name: 'sign', start: startSign },
    { name: 'dismiss', start: startDismiss },
  ])(
    'releases a $name hold with no answer at exactly 120 000 ms',
    async ({ start }) => {
      const action = start(lock, controls);
      action.catch(() => null);
      await flush();

      jest.advanceTimersByTime(SIGN_LOCK_TIMEOUT_MS - 1);
      await flush();
      expect(lock.store.getState()).not.toBeNull();
      await expectConcurrentStartRefused();

      jest.advanceTimersByTime(1);
      await flush();
      expect(SIGN_LOCK_TIMEOUT_MS).toBe(120_000);
      expect(lock.store.getState()).toBeNull();
      await expect(action).rejects.toBeInstanceOf(SignLockTimeoutError);
    }
  );

  it('releases when the holder presses Cancel', async () => {
    const action = startSign(lock, controls);
    await flush();
    expect(lock.store.getState()).not.toBeNull();

    lock.cancel();

    expect(lock.store.getState()).toBeNull();
    await expect(action).resolves.toEqual({ kind: 'cancelled' });
  });
});

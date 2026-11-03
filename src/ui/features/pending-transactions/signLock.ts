import { Store } from 'store-unit';

export const SIGN_LOCK_TIMEOUT_MS = 120_000;

export type SignLockKind = 'sign' | 'dismiss';

export type SignLockHolder = { pendingActionId: string; kind: SignLockKind };

export class SignLockBusyError extends Error {
  name = 'SignLockBusyError';
  constructor() {
    super('Another transaction is being signed or dismissed');
  }
}

export class SignLockCancelledError extends Error {
  name = 'SignLockCancelledError';
  constructor() {
    super('Cancelled');
  }
}

export class SignLockTimeoutError extends Error {
  name = 'SignLockTimeoutError';
  constructor() {
    super(
      `No answer within ${
        SIGN_LOCK_TIMEOUT_MS / 1000
      } seconds, please try again`
    );
  }
}

export interface SignLockHold {
  /** Aborted with a `SignLockCancelledError` or a `SignLockTimeoutError` */
  signal: AbortSignal;
  release(): void;
}

export interface SignLock {
  store: Store<SignLockHolder | null>;
  acquire(holder: SignLockHolder): SignLockHold | null;
  /** Ends the current hold as the holder's Cancel button does */
  cancel(): void;
}

/** One Sign or Dismiss across all pending rows; every hold ends after `SIGN_LOCK_TIMEOUT_MS` at the latest. */
export function createSignLock(): SignLock {
  const store = new Store<SignLockHolder | null>(null);
  let current: {
    token: object;
    controller: AbortController;
    timer: ReturnType<typeof setTimeout>;
  } | null = null;

  function end(token: object, reason?: Error) {
    if (!current || current.token !== token) {
      return;
    }
    const { controller, timer } = current;
    current = null;
    clearTimeout(timer);
    store.setState(null);
    if (reason) {
      controller.abort(reason);
    }
  }

  return {
    store,
    acquire(holder) {
      if (current) {
        return null;
      }
      const token = {};
      const controller = new AbortController();
      const timer = setTimeout(
        () => end(token, new SignLockTimeoutError()),
        SIGN_LOCK_TIMEOUT_MS
      );
      current = { token, controller, timer };
      store.setState(holder);
      return { signal: controller.signal, release: () => end(token) };
    },
    cancel() {
      if (current) {
        end(current.token, new SignLockCancelledError());
      }
    },
  };
}

export const signLock = createSignLock();

/** Settles with `promise`, or rejects with the signal's reason as soon as it aborts. */
export function untilAborted<T>(
  promise: Promise<T>,
  signal: AbortSignal
): Promise<T> {
  if (signal.aborted) {
    return Promise.reject(signal.reason);
  }
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(signal.reason);
    signal.addEventListener('abort', onAbort, { once: true });
    promise.then(
      (value) => {
        signal.removeEventListener('abort', onAbort);
        resolve(value);
      },
      (error) => {
        signal.removeEventListener('abort', onAbort);
        reject(error);
      }
    );
  });
}

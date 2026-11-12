import { QueueAbortError, QueueError } from './errors';
import { signTransactions } from './signTransactions';
import { getQueues } from './store';
import type { SignStep, SignTransactionsOptions } from './types';

/**
 * Enqueues `steps` and settles when the calling form may be reused.
 *
 * Resolves when step 0 has been broadcast. Rejects if step 0 fails or the
 * queue is aborted before that; a failure of step 0 is unwrapped to its
 * cause. Whatever happens after the first broadcast (later steps, on-chain
 * failure) is reported by the toaster, not by this promise.
 *
 * With `resolveWhenQueuedBehind`, it also resolves at once when another queue
 * is already ahead of this one, so the form is not blocked while it waits in
 * line.
 */
export function signUntilFirstBroadcast(
  steps: SignStep[],
  options: Omit<SignTransactionsOptions, 'onEvent'>,
  { resolveWhenQueuedBehind }: { resolveWhenQueuedBehind: boolean },
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    let settled = false;
    const settle = (fn: () => void) => {
      if (settled) return;
      settled = true;
      fn();
    };

    const { promise: queuePromise } = signTransactions(steps, {
      ...options,
      onEvent: (event) => {
        if (event.type === 'step-pending' && event.index === 0) {
          settle(resolve);
        } else if (event.type === 'step-error' && event.index === 0) {
          settle(() => reject(event.error));
        } else if (event.type === 'queue-aborted' && event.index === 0) {
          settle(() => reject(new QueueAbortError(0, [])));
        }
      },
    });

    // signTransactions appends synchronously, so more than one queue means
    // another one is ahead of ours.
    if (resolveWhenQueuedBehind && getQueues().length > 1) {
      settle(resolve);
    }

    // Pre-flight rejections (e.g. ReadonlyWalletError) never emit step events.
    queuePromise.catch((err) => {
      const unwrapped = err instanceof QueueError && err.failedAt === 0 ? err.cause : err;
      settle(() => reject(unwrapped));
    });
  });
}

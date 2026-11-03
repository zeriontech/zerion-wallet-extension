import { getError } from 'get-error';
import {
  deniedByUser,
  parseLedgerError,
} from '@zeriontech/hardware-wallet-connection';
import { isDeviceAccount } from 'src/shared/types/validators';
import { getAddressType } from 'src/shared/wallet/classifiers';
import { postLedgerSignParams } from 'src/ui/hardware-wallet/useLedgerIframeController';
import { QueueAbortError, QueueError, ReadonlyWalletError } from './errors';
import { isReadonlyWallet } from './signTransactions';
import {
  emitQueueEvent,
  removeQueue,
  updateQueueRun,
  type QueueRecord,
} from './store';
import { isStepStale, refreshStaleGasForStep } from './refreshStaleGas';
import type { SignStep, StepResult } from './types';

export type RunStep = (args: {
  queue: QueueRecord;
  step: SignStep;
  index: number;
}) => Promise<StepResult>;

export function isAbortLikeError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  if (error.name === 'AbortError') return true;
  // Ledger-denied is treated as user-dismissed
  try {
    const parsed = parseLedgerError(error);
    if (deniedByUser(parsed)) return true;
  } catch {
    // not a ledger error
  }
  return false;
}

export async function runQueue(
  queue: QueueRecord,
  runStep: RunStep
): Promise<void> {
  const { queueId, steps, options, abortController, resolve, reject } = queue;
  const completed: StepResult[] = [];

  // For hardware queues, push ecosystem (and bluetooth, in case the hook
  // hasn't pushed yet) into the iframe before the first sign call. All steps
  // in a queue share an ecosystem.
  if (isDeviceAccount(options.wallet)) {
    postLedgerSignParams({
      ecosystem: getAddressType(options.wallet.address),
    });
  }

  // Pre-flight: readonly check.
  try {
    const readonly = await isReadonlyWallet(options.wallet.address);
    if (readonly) {
      reject(new ReadonlyWalletError(options.wallet.address));
      removeQueue(queueId);
      return;
    }
  } catch (error) {
    reject(error instanceof Error ? error : new Error(String(error)));
    removeQueue(queueId);
    return;
  }

  if (abortController.signal.aborted) {
    emitQueueEvent(queueId, {
      type: 'queue-aborted',
      reason: 'user-dismissed',
      index: 0,
    });
    reject(new QueueAbortError(0, completed));
    removeQueue(queueId);
    return;
  }

  for (let index = 0; index < steps.length; index++) {
    if (abortController.signal.aborted) {
      updateQueueRun(queueId, { state: 'aborted', abortedAt: index });
      emitQueueEvent(queueId, {
        type: 'queue-aborted',
        reason: 'user-dismissed',
        index,
      });
      reject(new QueueAbortError(index, completed));
      removeQueue(queueId);
      return;
    }

    updateQueueRun(queueId, { state: 'running', currentStep: index });
    emitQueueEvent(queueId, { type: 'step-start', index });

    // If the queue sat long enough that the original gas estimate may be
    // stale (e.g. hardware-wallet confirmation took >1min), re-estimate
    // gasLimit before sending. Mutate in place so later iterations see the
    // updated step.
    if (isStepStale(queue.enqueuedAt)) {
      steps[index] = await refreshStaleGasForStep(steps[index]);
    }

    try {
      const result = await runStep({ queue, step: steps[index], index });
      completed.push(result);
      emitQueueEvent(queueId, { type: 'step-success', index, result });
    } catch (rawError) {
      // Normalize via getError so JSON-RPC rejections (plain { code, message,
      // data } objects) keep their message instead of stringifying to
      // "[object Object]".
      const error = getError(rawError);

      // User cancelled (abort signal already set, or Ledger denied) — emit
      // queue-aborted, not step-error.
      if (abortController.signal.aborted || isAbortLikeError(error)) {
        updateQueueRun(queueId, { state: 'aborted', abortedAt: index });
        emitQueueEvent(queueId, {
          type: 'queue-aborted',
          reason: 'user-dismissed',
          index,
        });
        reject(new QueueAbortError(index, completed));
        removeQueue(queueId);
        return;
      }

      updateQueueRun(queueId, { state: 'error', failedAt: index, error });
      emitQueueEvent(queueId, { type: 'step-error', index, error });
      reject(new QueueError(index, completed, error));
      removeQueue(queueId);
      return;
    }
  }

  updateQueueRun(queueId, { state: 'done', results: completed });
  emitQueueEvent(queueId, { type: 'queue-done', results: completed });
  resolve(completed);
  removeQueue(queueId);
}

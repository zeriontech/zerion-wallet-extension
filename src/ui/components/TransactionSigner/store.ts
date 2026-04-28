import { createNanoEvents } from 'nanoevents';
import { nanoid } from 'nanoid';
import type { SignTransactionResult } from 'src/shared/types/SignTransactionResult';
import type {
  QueueEvent,
  QueueRunStatus,
  QueueStatus,
  SignStep,
  SignTransactionsOptions,
} from './types';

export interface QueueRecord {
  queueId: string;
  steps: SignStep[];
  options: SignTransactionsOptions;
  run: QueueRunStatus;
  resolve: (results: SignTransactionResult[]) => void;
  reject: (error: Error) => void;
}

type StoreEvents = {
  change: () => void;
  queueEvent: (queueId: string, event: QueueEvent) => void;
};

const queues: QueueRecord[] = [];
const emitter = createNanoEvents<StoreEvents>();

export function getQueues(): readonly QueueRecord[] {
  return queues;
}

export function getQueue(queueId: string): QueueRecord | undefined {
  return queues.find((q) => q.queueId === queueId);
}

export function getQueueStatus(queueId: string): QueueStatus | null {
  const queue = getQueue(queueId);
  if (!queue) return null;
  return {
    queueId: queue.queueId,
    totalSteps: queue.steps.length,
    run: queue.run,
  };
}

export function appendQueue(
  steps: SignStep[],
  options: SignTransactionsOptions
): {
  queueId: string;
  promise: Promise<SignTransactionResult[]>;
} {
  const queueId = nanoid();
  let resolve!: (results: SignTransactionResult[]) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<SignTransactionResult[]>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  queues.push({
    queueId,
    steps,
    options,
    run: { state: 'pending' },
    resolve,
    reject,
  });
  emitter.emit('change');
  return { queueId, promise };
}

export function updateQueueRun(queueId: string, run: QueueRunStatus) {
  const queue = getQueue(queueId);
  if (!queue) return;
  queue.run = run;
  emitter.emit('change');
}

export function emitQueueEvent(queueId: string, event: QueueEvent) {
  const queue = getQueue(queueId);
  if (!queue) return;
  // Observation-only; lifecycle owned by caller. Drop if onEvent throws —
  // signer must not be derailed by caller bugs.
  try {
    queue.options.onEvent?.(event);
  } catch {
    // ignore
  }
  emitter.emit('queueEvent', queueId, event);
}

export function removeQueue(queueId: string) {
  const index = queues.findIndex((q) => q.queueId === queueId);
  if (index === -1) return;
  queues.splice(index, 1);
  emitter.emit('change');
}

export function subscribeChange(listener: () => void): () => void {
  return emitter.on('change', listener);
}

export function subscribeQueueEvent(
  listener: (queueId: string, event: QueueEvent) => void
): () => void {
  return emitter.on('queueEvent', listener);
}

let mounted = false;
export function claimSingletonMount(): () => void {
  if (mounted) {
    throw new Error(
      'TransactionSigner is already mounted. It must be rendered exactly once.'
    );
  }
  mounted = true;
  return () => {
    mounted = false;
  };
}

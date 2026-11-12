import { QueueAbortError, QueueError } from './errors';
import { signTransactions } from './signTransactions';
import { getQueues } from './store';
import { signUntilFirstBroadcast } from './signUntilFirstBroadcast';
import type { QueueEvent, SignStep, SignTransactionsOptions } from './types';

// The real modules reach into the wallet port and the queue runner
vi.mock('./signTransactions', () => ({ signTransactions: vi.fn() }));
vi.mock('./store', () => ({ getQueues: vi.fn() }));

const steps = [{ kind: 'send', params: {} }] as unknown as SignStep[];
const options = {
  holdToSign: false,
  bluetoothSupportEnabled: null,
} as unknown as Omit<SignTransactionsOptions, 'onEvent'>;

/** Lets the test drive the queue: emit events and settle the queue promise */
function setupQueue({ queuesInLine = 1 }: { queuesInLine?: number } = {}) {
  let emit: (event: QueueEvent) => void = () => {};
  let rejectQueue: (error: unknown) => void = () => {};
  const promise = new Promise<never>((_, reject) => {
    rejectQueue = reject;
  });
  vi.mocked(signTransactions).mockImplementation((_steps, opts) => {
    emit = opts.onEvent ?? emit;
    return { queueId: 'q', promise };
  });
  vi.mocked(getQueues).mockReturnValue(new Array(queuesInLine).fill({}));
  return { emit: (event: QueueEvent) => emit(event), rejectQueue };
}

/** Lets all queued promise callbacks run, then reports whether the promise has settled */
async function stateOf(promise: Promise<unknown>) {
  let state: 'pending' | 'resolved' | 'rejected' = 'pending';
  promise.then(
    () => {
      state = 'resolved';
    },
    () => {
      state = 'rejected';
    },
  );
  await new Promise((resolve) => setTimeout(resolve, 0));
  return state;
}

describe('signUntilFirstBroadcast', () => {
  it('resolves when step 0 is broadcast', async () => {
    const queue = setupQueue();
    const result = signUntilFirstBroadcast(steps, options, { resolveWhenQueuedBehind: true });
    expect(await stateOf(result)).toBe('pending');
    queue.emit({ type: 'step-pending', index: 0, txHash: '0x1' });
    await expect(result).resolves.toBeUndefined();
  });

  it('ignores events of later steps', async () => {
    const queue = setupQueue();
    const result = signUntilFirstBroadcast(steps, options, { resolveWhenQueuedBehind: true });
    queue.emit({ type: 'step-pending', index: 1, txHash: '0x2' });
    queue.emit({ type: 'step-error', index: 1, error: new Error('later') });
    expect(await stateOf(result)).toBe('pending');
  });

  it('rejects with the step error when step 0 fails', async () => {
    const queue = setupQueue();
    const result = signUntilFirstBroadcast(steps, options, { resolveWhenQueuedBehind: true });
    queue.emit({ type: 'step-error', index: 0, error: new Error('user rejected') });
    await expect(result).rejects.toThrow('user rejected');
  });

  it('rejects with QueueAbortError when the queue is aborted at step 0', async () => {
    const queue = setupQueue();
    const result = signUntilFirstBroadcast(steps, options, { resolveWhenQueuedBehind: true });
    queue.emit({ type: 'queue-aborted', reason: 'user-dismissed', index: 0 });
    await expect(result).rejects.toBeInstanceOf(QueueAbortError);
  });

  it('unwraps a QueueError that failed at step 0', async () => {
    const queue = setupQueue();
    const result = signUntilFirstBroadcast(steps, options, { resolveWhenQueuedBehind: true });
    queue.rejectQueue(new QueueError(0, [], new Error('readonly wallet')));
    await expect(result).rejects.toThrow('readonly wallet');
    await expect(result).rejects.not.toBeInstanceOf(QueueError);
  });

  it('resolves at once when queued behind another queue, if asked to', async () => {
    setupQueue({ queuesInLine: 2 });
    const result = signUntilFirstBroadcast(steps, options, { resolveWhenQueuedBehind: true });
    await expect(result).resolves.toBeUndefined();
  });

  it('keeps waiting behind another queue when not asked to resolve early', async () => {
    const queue = setupQueue({ queuesInLine: 2 });
    const result = signUntilFirstBroadcast(steps, options, { resolveWhenQueuedBehind: false });
    expect(await stateOf(result)).toBe('pending');
    queue.emit({ type: 'step-pending', index: 0, txHash: '0x1' });
    await expect(result).resolves.toBeUndefined();
  });

  it('does not reject after it has resolved', async () => {
    const queue = setupQueue();
    const result = signUntilFirstBroadcast(steps, options, { resolveWhenQueuedBehind: true });
    queue.emit({ type: 'step-pending', index: 0, txHash: '0x1' });
    queue.rejectQueue(new Error('failed on chain'));
    await expect(result).resolves.toBeUndefined();
  });
});

import { createSerialQueue } from './createSerialQueue';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('createSerialQueue', () => {
  it('does not start a task until the previous one has finished', async () => {
    const enqueue = createSerialQueue();
    const first = deferred<void>();
    const started: string[] = [];

    const firstDone = enqueue(async () => {
      started.push('first');
      await first.promise;
    });
    const secondDone = enqueue(async () => {
      started.push('second');
    });

    await Promise.resolve();
    await Promise.resolve();
    expect(started).toEqual(['first']);

    first.resolve();
    await Promise.all([firstDone, secondDone]);
    expect(started).toEqual(['first', 'second']);
  });

  it('resolves with the value of the task', async () => {
    const enqueue = createSerialQueue();
    await expect(enqueue(async () => 42)).resolves.toBe(42);
  });

  it('delivers a rejection to the caller and still runs later tasks', async () => {
    const enqueue = createSerialQueue();
    const failed = enqueue(async () => {
      throw new Error('boom');
    });
    const next = enqueue(async () => 'ok');

    await expect(failed).rejects.toThrow('boom');
    await expect(next).resolves.toBe('ok');
  });
});

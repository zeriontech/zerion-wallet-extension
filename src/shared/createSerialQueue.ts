/**
 * Returns an `enqueue` function that runs async tasks one at a time, in the
 * order they were enqueued. A task that rejects does not block later tasks;
 * its rejection is delivered to whoever enqueued it.
 */
export function createSerialQueue() {
  let tail: Promise<unknown> = Promise.resolve();
  return function enqueue<T>(task: () => Promise<T>): Promise<T> {
    const result = tail.then(task);
    tail = result.catch(() => undefined);
    return result;
  };
}

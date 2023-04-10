function anyFallback<T>(values: Array<PromiseLike<T>>): Promise<Awaited<T>> {
  const identity = <T>(x: T) => x;
  return Promise.all(
    values.map((promise) =>
      promise.then((result) => {
        throw result;
      }, identity)
    )
  ).then(() => {
    throw new Error('AggregateError (Promise.all)');
  }, identity);
}

export function anyPromise<T>(
  values: Array<PromiseLike<T>>
): Promise<Awaited<T>> {
  // @ts-ignore Promise.any
  const any = Promise.any ? (values) => Promise.any(values) : null;
  return any ? any(values) : anyFallback(values);
}

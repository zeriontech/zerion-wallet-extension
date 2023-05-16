class AggregateErrorFallback extends Error {
  errors: Array<Error>;
  constructor(message: string, errors: Array<Error>) {
    super(message);
    this.name = 'AggregateError';
    this.errors = errors;
  }
}

function anyFallback<T>(values: Array<PromiseLike<T>>): Promise<Awaited<T>> {
  const identity = <T>(x: T) => x;
  const errors: Array<Error> = [];
  return Promise.all(
    values.map((promise) =>
      promise.then(
        (result) => {
          throw result;
        },
        (error) => {
          errors.push(error);
          return error;
        }
      )
    )
  ).then(() => {
    const error = new AggregateErrorFallback(
      'All promises were rejected',
      errors
    );
    error.errors = errors;
    throw error;
  }, identity);
}

export function anyPromise<T>(
  values: Array<PromiseLike<T>>
): Promise<Awaited<T>> {
  // @ts-ignore Promise.any
  const any = Promise.any ? (values) => Promise.any(values) : null;
  return any ? any(values) : anyFallback(values);
}

interface AggregateErrorShape {
  errors: Array<Error>;
}

export function isAggregateError(error: unknown): error is AggregateErrorShape {
  return (
    error instanceof Error && 'errors' in error && Array.isArray(error.errors)
  );
}

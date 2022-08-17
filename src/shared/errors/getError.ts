function isErrorMessageObject(value: unknown): value is { message: string } {
  return Boolean(value && 'message' in (value as { message?: string }));
}

export function getError(value: Error | unknown): Error {
  return value instanceof Error
    ? value
    : isErrorMessageObject(value)
    ? new Error(value.message)
    : new Error('Unknown Error');
}

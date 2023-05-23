import type { JsonRpcError } from '@json-rpc-tools/utils';
import { isJsonRpcError, isJsonRpcPayload } from '@json-rpc-tools/utils';

function isErrorMessageObject(value: unknown): value is { message: string } {
  return Boolean(value && 'message' in (value as { message?: string }));
}

function fromRpcError(value: Omit<JsonRpcError, 'error'> & { error: unknown }) {
  // `isJsonRpcError` implementation is not completely correct, so we do an additional check
  if (isErrorMessageObject(value.error)) {
    return new Error(value.error.message);
  }
  return new Error('Unknown Error');
}

export function getError(value: Error | unknown): Error {
  return value instanceof Error
    ? value
    : isErrorMessageObject(value)
    ? new Error(value.message)
    : isJsonRpcPayload(value) && isJsonRpcError(value)
    ? fromRpcError(value)
    : new Error('Unknown Error');
}

import type { JsonRpcError } from '@json-rpc-tools/utils';
import { isJsonRpcError, isJsonRpcPayload } from '@json-rpc-tools/utils';
import type { ExtendedError } from './errors';

function isErrorMessageObject(value: unknown): value is { message: string } {
  return Boolean(value && 'message' in (value as { message?: string }));
}

function fromMessageObject(value: { message: string }) {
  const error = new Error(value.message) as ExtendedError;
  if ('code' in value && typeof value.code === 'number') {
    error.code = value.code;
  }
  if ('data' in value && typeof value.data === 'string') {
    error.data = value.data;
  }
  return error;
}

function fromRpcError(value: Omit<JsonRpcError, 'error'> & { error: unknown }) {
  // `isJsonRpcError` implementation is not completely correct, so we do an additional check
  if (isErrorMessageObject(value.error)) {
    return fromMessageObject(value.error);
  }
  return new Error('Unknown Error');
}

function fromResponse(response: Response) {
  const message = `${response.status} ${response.statusText}`;
  return new Error(message);
}

export function getError(value: Error | unknown): ExtendedError {
  return value instanceof Error
    ? value
    : isErrorMessageObject(value)
    ? fromMessageObject(value)
    : isJsonRpcPayload(value) && isJsonRpcError(value)
    ? fromRpcError(value)
    : value instanceof Response
    ? fromResponse(value)
    : new Error('Unknown Error');
}

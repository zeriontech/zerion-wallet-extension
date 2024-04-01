import type { JsonRpcError } from '@walletconnect/jsonrpc-utils';
import { isJsonRpcError, isJsonRpcPayload } from '@walletconnect/jsonrpc-utils';
import type { ExtendedError } from './errors';

function isErrorMessageObject(value: unknown): value is { message: string } {
  return Boolean(value && 'message' in (value as { message?: string }));
}

function fromMessageObject(value: { message: string }) {
  const error = new Error(value.message) as ExtendedError;
  return Object.assign(error, value);
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

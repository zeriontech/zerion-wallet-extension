import type { JsonRpcError } from '@json-rpc-tools/utils';
import { isJsonRpcError, isJsonRpcPayload } from '@json-rpc-tools/utils';
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
  // TODO: maybe a better pattern would be to merge
  // type guards and parsers together, where parsers would return null for
  // unrecognized values. Therefore, this function would read as (not final):
  // return fromMessageObject(value) || fromRpcError(value) || fromResponse(value) || fallback;
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

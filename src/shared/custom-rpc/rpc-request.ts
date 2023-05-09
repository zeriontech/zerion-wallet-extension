import ky from 'ky';
import {
  isJsonRpcRequest,
  formatJsonRpcError,
  isJsonRpcPayload,
  isJsonRpcError,
  isJsonRpcResult,
  formatJsonRpcRequest,
} from '@json-rpc-tools/utils';
import type {
  JsonRpcError,
  JsonRpcResult,
  JsonRpcRequest,
} from '@json-rpc-tools/utils';
import { getError } from '../errors/getError';

/**
 * fulfillRpcRequest always resolves with JsonRpcResult | JsonRpcError
 */
export async function fulfillRpcRequest<T>(
  url: string,
  request: JsonRpcRequest
): Promise<JsonRpcResult<T> | JsonRpcError> {
  if (!isJsonRpcRequest(request)) {
    console.warn('not a request:', request); // eslint-disable-line no-console
    return Promise.reject('not a request');
  }
  try {
    const data = await ky(url, {
      method: 'post',
      body: JSON.stringify(request),
      headers: { 'Content-Type': 'application/json' },
    }).json();
    if (
      isJsonRpcPayload(data) &&
      (isJsonRpcResult(data) || isJsonRpcError(data))
    ) {
      return data;
    } else {
      return formatJsonRpcError(request.id, 'Invalid Response');
    }
  } catch (error) {
    return formatJsonRpcError(request.id, getError(error).message);
  }
}

/**
 * sendRpcRequest resolves with JsonRpcResult and throws with JsonRpcError
 */
export async function sendRpcRequest<T>(
  url: string,
  request: Partial<JsonRpcRequest> & Pick<JsonRpcRequest, 'method' | 'params'>
) {
  const payload = formatJsonRpcRequest(
    request.method,
    request.params,
    request.id
  );
  const result = await fulfillRpcRequest<T>(url, payload);
  if (isJsonRpcError(result)) {
    throw result;
  }
  return result;
}

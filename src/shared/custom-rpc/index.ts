import type { ErrorResponse, JsonRpcRequest } from '@json-rpc-tools/utils';
import { isJsonRpcPayload, isJsonRpcRequest } from '@json-rpc-tools/utils';
import { isObj } from '../isObj';

export interface RpcRequest<T = unknown> {
  id: string;
  method: string;
  params?: T;
}

export interface RpcResult<T = unknown> {
  id: string;
  result: T;
}

export interface RpcError {
  id: string;
  error: ErrorResponse;
}

export function isRpcResult<T = unknown>(
  payload: Partial<RpcResult<T>> | unknown
): payload is RpcResult<T> {
  return isObj(payload) && 'id' in payload && 'result' in payload;
}

export function isRpcError(
  payload: Partial<RpcError> | unknown
): payload is RpcError {
  return isObj(payload) && 'id' in payload && 'error' in payload;
}

export function isRpcResponse<T = unknown>(
  payload: Partial<RpcResult<T> | RpcError> | unknown
): payload is RpcResult<T> | RpcError {
  return isRpcResult(payload) || isRpcError(payload);
}

export function isRpcRequest(
  payload: Partial<RpcRequest> | unknown
): payload is RpcRequest {
  return isObj(payload) && 'id' in payload && 'method' in payload;
}

export type RpcRequestWithContext<T> = Omit<JsonRpcRequest<T>, 'params'> & {
  params: { params: T; context: { chainId: string } };
};

export function isRpcRequestWithContext<T>(
  x: unknown
): x is RpcRequestWithContext<T> {
  return (
    isObj(x) &&
    isJsonRpcPayload(x) &&
    isJsonRpcRequest(x) &&
    'params' in x.params &&
    'context' in x.params
  );
}

export function requestWithContextToRpcRequest<T>(
  request: RpcRequestWithContext<T>
): JsonRpcRequest<T> {
  const {
    params: { params },
  } = request;
  return {
    params,
    id: request.id,
    method: request.method,
    jsonrpc: request.jsonrpc,
  };
}

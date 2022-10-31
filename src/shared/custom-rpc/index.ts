import type { ErrorResponse } from '@json-rpc-tools/utils';

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
  return payload != null && 'id' in payload && 'result' in payload;
}

export function isRpcError(
  payload: Partial<RpcError> | unknown
): payload is RpcError {
  return payload != null && 'id' in payload && 'error' in payload;
}

export function isRpcRequest(
  payload: Partial<RpcRequest> | unknown
): payload is RpcRequest {
  return payload != null && 'id' in payload && 'method' in payload;
}

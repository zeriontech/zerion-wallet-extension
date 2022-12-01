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

export function isObj(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x != null;
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

export function isRpcRequest(
  payload: Partial<RpcRequest> | unknown
): payload is RpcRequest {
  return isObj(payload) && 'id' in payload && 'method' in payload;
}

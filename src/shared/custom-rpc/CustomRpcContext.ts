import type { JsonRpcRequest } from '@json-rpc-tools/utils';
import { formatJsonRpcRequest } from '@json-rpc-tools/utils';
import { isObj } from '../isObj';

export interface CustomRpcContext {
  [key: string]: unknown;
}

export interface WrappedRpc<T> extends JsonRpcRequest<T> {
  customContext?: CustomRpcContext;
}

function isCustomRpcContext(x: unknown): x is CustomRpcContext {
  return isObj(x);
}

export function formatWrappedRpcRequest<T>(
  method: string,
  params: T,
  id?: number,
  customContext?: CustomRpcContext | unknown
): WrappedRpc<T> {
  const payload = formatJsonRpcRequest(method, params, id);
  if (isCustomRpcContext(customContext)) {
    return { ...payload, customContext };
  } else {
    return payload;
  }
}

import { formatJsonRpcRequest } from '@walletconnect/jsonrpc-utils';
import { getPayloadId } from './getPayloadId';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function formatJsonRpcRequestImproved<T = any>(
  method: string,
  params: T,
  maybeId?: number
) {
  /** Use our own getPayloadId() which guarantees uniqueness */
  const id = maybeId ?? getPayloadId();
  return formatJsonRpcRequest(method, params, id);
}

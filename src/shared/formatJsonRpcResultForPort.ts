import type { JsonRpcResult } from '@json-rpc-tools/utils';
import { formatJsonRpcResult } from '@json-rpc-tools/utils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function formatJsonRpcResultForPort<T = any | null | undefined>(
  id: number,
  result: T
) {
  const value = formatJsonRpcResult(id, result) as JsonRpcResult<T | null>;
  if (value.result === undefined) {
    // When messages are sent via ports, `undefined` propertires
    // get removed
    value.result = null;
  }
  return value;
}

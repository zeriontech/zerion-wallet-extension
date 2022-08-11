import { formatJsonRpcError, isReservedErrorCode } from '@json-rpc-tools/utils';

export function formatJsonRpcWalletError(
  id: number,
  error: Parameters<typeof formatJsonRpcError>[1]
) {
  if (!error || typeof error === 'string' || isReservedErrorCode(error.code)) {
    return formatJsonRpcError(id, error);
  } else {
    return {
      id,
      jsonrpc: '2.0',
      error,
    };
  }
}

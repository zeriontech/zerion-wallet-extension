import { formatJsonRpcError } from '@walletconnect/jsonrpc-utils';
import type { ExtendedError } from './errors/errors';

export function formatJsonRpcWalletError(
  id: number,
  error: Parameters<typeof formatJsonRpcError>[1] | ExtendedError
) {
  // if (!error || typeof error === 'string' || isReservedErrorCode(error.code)) {
  if (!error || typeof error === 'string') {
    return formatJsonRpcError(id, error);
  } else if ('code' in error === false) {
    return formatJsonRpcError(id, error.message);
  } else {
    return {
      id,
      jsonrpc: '2.0',
      error: Object.assign(
        // Extract values so that they're enumerable
        { message: error.message },
        error.code != null ? { code: error.code } : null,
        error.data ? { data: error.data } : null
      ),
    };
  }
}

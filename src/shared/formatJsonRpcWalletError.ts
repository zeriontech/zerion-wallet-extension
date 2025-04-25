import { formatJsonRpcError } from '@walletconnect/jsonrpc-utils';
import { toEnumerableError } from './errors/errors';

export function formatJsonRpcWalletError(id: number, error: Error) {
  // if (!error || typeof error === 'string' || isReservedErrorCode(error.code)) {
  if (!error || typeof error === 'string') {
    return formatJsonRpcError(id, error);
  } else if ('code' in error === false) {
    return formatJsonRpcError(id, error.message);
  } else {
    return {
      id,
      jsonrpc: '2.0',
      error: toEnumerableError(error),
    };
  }
}

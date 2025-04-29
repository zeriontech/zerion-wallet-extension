import { STANDARD_ERROR_MAP } from '@walletconnect/jsonrpc-utils';

/**
 * Provider Errors: https://eips.ethereum.org/EIPS/eip-1193#provider-errors
 * RPC Errors: https://eips.ethereum.org/EIPS/eip-1474#error-codes
 */

export type ExtendedError = Error & { code?: number; data?: string };

/** DOMException can have an empty message, this helper sets message to name */
export function domExceptionPatched(value: DOMException): DOMException {
  const result = new DOMException();
  const message = value.message || value.name;
  Object.defineProperty(result, 'message', { value: message });
  Object.defineProperty(result, 'name', { value: value.name });
  Object.defineProperty(result, 'code', { value: value.code });
  return result;
}

export function toEnumerableError(value: Error) {
  const error =
    value instanceof DOMException
      ? new DOMException(value.message)
      : new Error(value.message);
  const toDescriptor = <T>(value: T) => ({ value, enumerable: true });
  Object.defineProperty(error, 'message', toDescriptor(value.message));
  Object.defineProperty(error, 'name', toDescriptor(value.name));
  if ('code' in value) {
    Object.defineProperty(error, 'code', toDescriptor(value.code));
  }
  if ('data' in value) {
    Object.defineProperty(error, 'data', toDescriptor(value.data));
  }
  return error;
}

/** RPC Errors */

export class InvalidParams extends Error {
  code = STANDARD_ERROR_MAP.INVALID_PARAMS.code;

  constructor(message = STANDARD_ERROR_MAP.INVALID_PARAMS.message) {
    super(message);
  }
}

export class MethodNotFound extends Error {
  code = STANDARD_ERROR_MAP.METHOD_NOT_FOUND.code;

  constructor(message = STANDARD_ERROR_MAP.METHOD_NOT_FOUND.message) {
    super(message);
  }
}
export class MethodNotImplemented extends Error {
  code = -32004;

  constructor(message = 'Method not supported') {
    super(message);
  }
}

export class RecordNotFound extends Error {
  code = STANDARD_ERROR_MAP.INTERNAL_ERROR.code;
  constructor(message = 'Record not found') {
    super(message);
  }
}

/** Wallet Errors */

export class UserRejected extends Error {
  code = 4001; // User Rejected Request; The user rejected the request

  constructor(message = 'Rejected by User') {
    super(message);
  }
}

export class UserRejectedTxSignature extends Error {
  code = 4001;

  constructor(message = 'Tx Signature: User denied transaction signature.') {
    super(message);
  }
}

export class OriginNotAllowed extends Error {
  code = 4100; // Unauthorized; The requested method and/or account has not been authorized by the user

  constructor(
    message = 'Origin Not Allowed: Try calling eth_requestAccounts first.'
  ) {
    super(message);
  }
}

export class SwitchChainError extends Error {
  code = 4902;

  constructor(
    message = 'Unrecognized chainId: Try adding the chain using wallet_addEthereumChain first.'
  ) {
    super(message);
  }
}

export class SessionExpired extends Error {
  // 211210N is zerion in l33t
  code = 2312103;

  constructor(message = 'Session expired') {
    super(message);
  }
}

export class HandshakeFailed extends Error {}

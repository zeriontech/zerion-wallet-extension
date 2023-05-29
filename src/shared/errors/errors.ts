import { STANDARD_ERROR_MAP } from '@json-rpc-tools/utils';

export type ExtendedError = Error & { code?: number; data?: string };

export class ErrorWithEnumerableMessage extends Error {
  constructor(message: string) {
    super(message);
    Object.defineProperty(this, 'message', {
      value: message,
      enumerable: true,
    });
  }
}

export function domExceptionToError(error: DOMException) {
  const message = error.message || error.name;
  return new ErrorWithEnumerableMessage(message);
}

export class InvalidParams extends ErrorWithEnumerableMessage {
  code = STANDARD_ERROR_MAP.INVALID_PARAMS.code;

  constructor(message = STANDARD_ERROR_MAP.INVALID_PARAMS.message) {
    super(message);
  }
}

export class OriginNotAllowed extends ErrorWithEnumerableMessage {
  code = -32011;

  constructor(
    message = 'Origin Not Allowed: Try calling eth_requestAccounts first.'
  ) {
    super(message);
  }
}

export class UserRejected extends ErrorWithEnumerableMessage {
  code = -32010;

  constructor(message = 'Rejected by User') {
    super(message);
  }
}

export class UserRejectedTxSignature extends ErrorWithEnumerableMessage {
  code = 4001;

  constructor(message = 'Tx Signature: User denied transaction signature.') {
    super(message);
  }
}

export class MethodNotImplemented extends ErrorWithEnumerableMessage {
  code = -32601;

  constructor(message = 'Method not implemented') {
    super(message);
  }
}

export class RecordNotFound extends ErrorWithEnumerableMessage {
  code = -32602;
  constructor(message = 'Record not found') {
    super(message);
  }
}

export class SessionExpired extends ErrorWithEnumerableMessage {
  // 211210N is zerion in l33t
  code = 2312103;

  constructor(message = 'Session expired') {
    super(message);
  }
}

export class HandshakeFailed extends Error {}

import { STANDARD_ERROR_MAP } from '@json-rpc-tools/utils';

class ErrorWithEnumerableMessage extends Error {
  constructor(message: string) {
    super(message);
    Object.defineProperty(this, 'message', {
      value: message,
      enumerable: true,
    });
  }
}

export class InvalidParams extends ErrorWithEnumerableMessage {
  code = STANDARD_ERROR_MAP.INVALID_PARAMS.code;

  constructor(message = STANDARD_ERROR_MAP.INVALID_PARAMS.message) {
    super(message);
  }
}

export class OriginNotAllowed extends ErrorWithEnumerableMessage {
  code = -32011;

  constructor(origin?: string) {
    const message =
      'Method not allowed for this origin' + (origin ? `: ${origin}` : '');
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

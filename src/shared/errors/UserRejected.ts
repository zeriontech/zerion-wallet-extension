import { STANDARD_ERROR_MAP } from '@json-rpc-tools/utils';

export class InvalidParams extends Error {
  code = STANDARD_ERROR_MAP.INVALID_PARAMS.code;

  constructor(message?: string) {
    super(message || STANDARD_ERROR_MAP.INVALID_PARAMS.message);
  }
}

export class OriginNotAllowed extends Error {
  code = -32011;

  constructor(message?: string) {
    super(message || 'Method not allowed for this origin');
  }
}

export class UserRejected extends Error {
  code = -32010;

  constructor(message?: string) {
    super(message || 'Rejected by User');
  }
}

import { getError } from 'src/shared/errors/getError';

export function isSessionExpiredError(error: unknown) {
  return getError(error).message === 'Session expired';
}

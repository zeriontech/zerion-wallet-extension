import { getError } from 'src/shared/errors/getError';

export function isSessionExpiredError(e: unknown) {
  if (!e) {
    return false;
  }
  return getError(e).message === 'Session expired';
}

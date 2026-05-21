import { getError } from 'get-error';

export function isMnemonicRestorationError(err: unknown): boolean {
  return getError(err).name === 'OperationError';
}

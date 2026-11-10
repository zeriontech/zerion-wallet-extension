import { getError } from 'src/shared/errors/getErrorBase';

export function isMnemonicRestorationError(err: unknown): boolean {
  return getError(err).name === 'OperationError';
}

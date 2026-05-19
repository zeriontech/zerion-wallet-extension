import { emitter } from 'src/ui/shared/events';
import { isMnemonicRestorationError } from './isMnemonicRestorationError';

export function maybeTriggerMnemonicRestoration(err: unknown): void {
  if (isMnemonicRestorationError(err)) {
    emitter.emit('mnemonicRestorationNeeded');
  }
}

import { emitter } from '../events';

export function navigateProgrammatically(params: { pathname: string }) {
  emitter.emit('navigationRequest', params);
}

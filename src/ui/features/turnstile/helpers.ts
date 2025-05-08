import { emitter } from './events';

export function openTurnstileWidgetIfNeeded(response: Response) {
  if (response.headers.get('cf-mitigated') === 'challenge') {
    emitter.emit('openTurnstile');
  }
}

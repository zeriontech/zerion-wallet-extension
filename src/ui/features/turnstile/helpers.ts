import { emitter } from 'src/ui/shared/events';

export function openTurnstileWidgetIfNeeded(response: Response) {
  if (response.headers.get('cf-mitigated') === 'challenge') {
    emitter.emit('openTurnstile');
  }
}

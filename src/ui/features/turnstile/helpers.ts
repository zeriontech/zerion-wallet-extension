import browser from 'webextension-polyfill';
import {
  CLOUDFLARE_CHALLENGE_MESSAGE,
  type ChallengeSurface,
  type CloudflareChallengeMessage,
  type CloudflareChallengeState,
} from 'src/shared/cloudflareChallenge';
import { emitter } from './events';

export function openTurnstileWidgetIfNeeded(response: Response) {
  if (response.headers.get('cf-mitigated') === 'challenge') {
    emitter.emit('openTurnstile');
  }
}

function send(message: CloudflareChallengeMessage) {
  // The background listener only exists when the feature flag is on; a missing
  // receiver is expected and must not surface as an unhandled rejection.
  void browser.runtime.sendMessage(message).catch(() => {});
}

export function notifyChallengeSolved(surface: ChallengeSurface) {
  send({ type: CLOUDFLARE_CHALLENGE_MESSAGE, action: 'solved', surface });
}

export function notifyChallengeDismissed(surface: ChallengeSurface) {
  send({ type: CLOUDFLARE_CHALLENGE_MESSAGE, action: 'dismissed', surface });
}

export async function getChallengeState(): Promise<CloudflareChallengeState | null> {
  try {
    const response = (await browser.runtime.sendMessage({
      type: CLOUDFLARE_CHALLENGE_MESSAGE,
      action: 'get-state',
    } satisfies CloudflareChallengeMessage)) as CloudflareChallengeState | undefined;
    return response ?? null;
  } catch {
    return null;
  }
}

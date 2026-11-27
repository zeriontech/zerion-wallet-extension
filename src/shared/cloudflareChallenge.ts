/**
 * Messages between the extension UI (Turnstile sheet, Security check page) and
 * the service worker for the background Cloudflare challenge flow.
 *
 * Runtime messages are broadcast to every extension context, so both ends must
 * check `type` before acting. Background -> UI messages always mean "show the
 * existing Turnstile sheet in this UI"; UI -> background messages report the
 * outcome or ask whether a challenge is still pending.
 */
export const CLOUDFLARE_CHALLENGE_MESSAGE = 'cloudflare-challenge' as const;

export type ChallengeSurface = 'sheet' | 'page';
/** A silent solve happens in a hidden offscreen document. */
export type SolveSurface = ChallengeSurface | 'offscreen';

export interface CloudflareChallengeState {
  /** A background ZPI call is waiting for a clearance cookie. */
  pending: boolean;
  /** The user closed the Security check page without solving. */
  dismissed: boolean;
  /** Surface currently showing this challenge, if any. */
  surface?: ChallengeSurface | null;
  /** An offscreen attempt is running and should not be interrupted by the sheet. */
  silent?: boolean;
}

export type CloudflareChallengeMessage =
  | { type: typeof CLOUDFLARE_CHALLENGE_MESSAGE; action: 'show-sheet' }
  | { type: typeof CLOUDFLARE_CHALLENGE_MESSAGE; action: 'solved'; surface: SolveSurface }
  | { type: typeof CLOUDFLARE_CHALLENGE_MESSAGE; action: 'dismissed'; surface: ChallengeSurface }
  | { type: typeof CLOUDFLARE_CHALLENGE_MESSAGE; action: 'get-state' }
  | { type: typeof CLOUDFLARE_CHALLENGE_MESSAGE; action: 'offscreen-failed' };

export function isCloudflareChallengeMessage(value: unknown): value is CloudflareChallengeMessage {
  if (typeof value !== 'object' || value == null) {
    return false;
  }
  const message = value as { type?: unknown; action?: unknown };
  if (message.type !== CLOUDFLARE_CHALLENGE_MESSAGE) {
    return false;
  }
  return (
    message.action === 'show-sheet' ||
    message.action === 'solved' ||
    message.action === 'dismissed' ||
    message.action === 'get-state' ||
    message.action === 'offscreen-failed'
  );
}

/** Hash route of the full-page Security check. Must match `<Route path>` in App. */
export const SECURITY_CHECK_ROUTE = '/security-check';

export const SECURITY_CHECK_DOCUMENT_TITLE = 'Security check · Zerion';

export function isSecurityCheckUrl(url: string | undefined): boolean {
  return Boolean(url?.includes(`#${SECURITY_CHECK_ROUTE}`));
}

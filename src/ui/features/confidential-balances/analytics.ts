import { walletPort } from 'src/ui/shared/channels';
import type { ConfidentialAnalyticsEvent } from 'src/shared/types/confidential-events';

/** Fire-and-forget: analytics must never block or fail the Reveal flow */
export function trackConfidentialEvent(event: ConfidentialAnalyticsEvent) {
  walletPort.request('confidentialAnalyticsEvent', event).catch(() => null);
}

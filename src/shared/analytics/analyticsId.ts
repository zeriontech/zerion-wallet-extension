import { BrowserStorage } from 'src/background/webapis/storage';
import { getCurrentUser } from '../getCurrentUser';

/**
 * Analytics ID is used as userId in analytics events.
 * It it set during onboarding with the help of <AnalyticsUserIdHandler /> and shouldn't be changed later.
 * It is synced with Web App and zerion.io landing page the same way as refferal code.
 * In case, user ID can't be set from Web App, device ID is used instead as a fallback.
 *
 * All analytics events should use this ID as userId.
 * This is why we send `General: First Screen View` event after this ID is set
 *
 * This ID is used by Mixpanel, Statsig and Google Analytics.
 *
 * This ID is not used for any other purposes, like user identification or authentication.
 * This ID is random and not connected to any user data.
 */

export const analyticsIdKey = 'z-user-id';

export async function getAnalyticsId() {
  return (
    (await BrowserStorage.get<string>(analyticsIdKey)) ||
    (await getCurrentUser())?.id
  );
}

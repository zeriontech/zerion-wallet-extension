import { BrowserStorage } from 'src/background/webapis/storage';
import { getCurrentUser } from '../getCurrentUser';

export const analyticsIdKey = 'z-user-id';

export async function getAnalyticsId() {
  return (
    (await BrowserStorage.get<string>(analyticsIdKey)) ||
    (await getCurrentUser())?.id
  );
}

import { BrowserStorage } from 'src/background/webapis/storage';
import { analyticsIdKey } from './analyticsId';

export async function setAnalyticsId(id: string) {
  await BrowserStorage.set(analyticsIdKey, id);
}

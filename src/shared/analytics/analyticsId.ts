import { BrowserStorage } from 'src/background/webapis/storage';

const analyticsIdKey = 'z-user-id';

export async function getAnalyticsId() {
  return BrowserStorage.get<string>(analyticsIdKey);
}

export async function setAnalyticsId(id: string) {
  await BrowserStorage.set(analyticsIdKey, id);
}

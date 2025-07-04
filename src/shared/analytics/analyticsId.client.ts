import { BrowserStorage } from 'src/background/webapis/storage';
import { walletPort } from 'src/ui/shared/channels';
import { analyticsIdKey } from './analyticsId';

export async function setAnalyticsIdIfNeeded(id: string) {
  const currentId = await BrowserStorage.get<string>(analyticsIdKey);
  if (currentId) {
    // We shouldn't rewrite existing id
    return;
  }
  await BrowserStorage.set(analyticsIdKey, id);
  walletPort.request('analyticsIdSet');
}

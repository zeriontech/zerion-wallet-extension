import { BrowserStorage } from 'src/background/webapis/storage';
import { walletPort } from 'src/ui/shared/channels';
import { analyticsIdKey } from './analyticsId';

export async function setAnalyticsIdIfNeeded(id: string) {
  await BrowserStorage.set(analyticsIdKey, id);
  walletPort.request('analyticsIdSet');
}

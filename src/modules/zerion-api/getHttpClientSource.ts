import { getPreferences } from 'src/ui/features/preferences/usePreferences';
import type { BackendSourceParams } from './shared';

type Source = BackendSourceParams['source'];
export async function getHttpClientSource(): Promise<Source> {
  const preferences = await getPreferences();
  return preferences?.testnetMode?.on ? 'testnet' : 'mainnet';
}

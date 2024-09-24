import { usePreferences } from 'src/ui/features/preferences';
import type { BackendSourceParams } from '../shared';

export function useHttpClientSource(): BackendSourceParams['source'] {
  const { preferences } = usePreferences();
  return preferences?.testnetMode?.on ? 'testnet' : 'mainnet';
}

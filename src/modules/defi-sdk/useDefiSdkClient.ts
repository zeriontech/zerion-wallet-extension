import { usePreferences } from 'src/ui/features/preferences';
import { client } from 'defi-sdk';
import { configureUITestClient } from './index';

export function useDefiSdkClient() {
  const { preferences } = usePreferences();
  return preferences?.testnetMode?.on ? configureUITestClient() : client;
}

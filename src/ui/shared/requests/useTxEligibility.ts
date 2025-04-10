import { useQuery } from '@tanstack/react-query';
import type { ZerionApiClient } from 'src/modules/zerion-api/zerion-api-bare';
import { ZerionAPI } from 'src/modules/zerion-api/zerion-api.client';
import { usePreferences } from 'src/ui/features/preferences';
import { adjustedCheckEligibility } from 'src/modules/ethereum/account-abstraction/fetchAndAssignPaymaster';

export function useTxEligibility(
  tx: Parameters<ZerionApiClient['paymasterCheckEligibility']>[0] | null,
  { enabled: enabledParam = true } = {}
) {
  const { preferences } = usePreferences();
  const source = preferences?.testnetMode?.on ? 'testnet' : 'mainnet';
  const enabled = !tx ? false : enabledParam;
  return useQuery({
    suspense: false,
    queryKey: ['adjustedCheckEligibility', tx, source],
    queryFn: async () => {
      if (!tx) {
        return null;
      }
      return adjustedCheckEligibility(tx, { source, apiClient: ZerionAPI });
    },
    enabled,
  });
}

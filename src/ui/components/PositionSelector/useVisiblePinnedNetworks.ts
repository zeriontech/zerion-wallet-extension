import { useMemo } from 'react';
import type { Networks } from 'src/modules/networks/Networks';
import type { NetworkInfo } from 'src/modules/networks/NetworkInfo';
import type { BlockchainType } from 'src/shared/wallet/classifiers';
import { usePreferences } from 'src/ui/features/preferences';

/**
 * User-pinned networks eligible to appear as chips: same ecosystem, testnet
 * mode and `hidden` filtering that NetworkSelect2 applies to its pinned group
 * (see createNetworkGroups2). Callers layer their own capability predicate.
 */
export function useVisiblePinnedNetworks(
  networks: Networks | null | undefined,
  standard: BlockchainType | 'all' = 'all'
): NetworkInfo[] {
  const { preferences } = usePreferences();
  const testnetMode = Boolean(preferences?.testnetMode?.on);
  return useMemo(
    () =>
      networks
        ?.getPinnedNetworks(standard)
        .filter(
          (network) =>
            Boolean(network.testnet) === testnetMode && !network.hidden
        ) ?? [],
    [networks, standard, testnetMode]
  );
}

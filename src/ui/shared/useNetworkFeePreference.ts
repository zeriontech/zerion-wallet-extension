import { useMemo } from 'react';
import type { NetworkFeeConfiguration } from 'src/shared/types/TransactionConfiguration';
import {
  resolveSavedNetworkFee,
  withSavedNetworkFee,
} from 'src/shared/networkFeePreference';
import { useGlobalPreferences } from 'src/ui/features/preferences/usePreferences';
import { useEvent } from 'src/ui/shared/useEvent';

/**
 * Reads the persisted per-chain fee selection and writes back picks.
 * The value is resolved once per chain/preference change, so an open form does
 * not flip levels when a Custom entry crosses its 24h expiry.
 */
export function useNetworkFeePreference(chainId: string | null | undefined) {
  const { globalPreferences, setGlobalPreferences } = useGlobalPreferences();
  const preferences = globalPreferences?.networkFeeByChain;

  const savedNetworkFee = useMemo(
    () => (chainId ? resolveSavedNetworkFee(preferences, chainId) : null),
    [preferences, chainId]
  );

  const saveNetworkFee = useEvent((configuration: NetworkFeeConfiguration) => {
    if (!chainId) return;
    setGlobalPreferences({
      networkFeeByChain: withSavedNetworkFee(
        preferences,
        chainId,
        configuration
      ),
    });
  });

  return { savedNetworkFee, saveNetworkFee };
}

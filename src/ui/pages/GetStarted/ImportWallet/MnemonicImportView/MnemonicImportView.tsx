import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { PageBottom } from 'src/ui/components/PageBottom';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { ViewLoading } from 'src/ui/components/ViewLoading';
import { walletPort } from 'src/ui/shared/channels';
import { useAddressActivity } from 'src/ui/shared/requests/useAddressActivity';
import { useStaleTime } from 'src/ui/shared/useStaleTime';
import { useBackgroundKind } from 'src/ui/components/Background';
import { useBodyStyle } from 'src/ui/components/Background/Background';
import type { MemoryLocationState } from '../memoryLocationState';
import { useMemoryLocationState } from '../memoryLocationState';
import type { DerivedWallets } from './AddressImportFlow';
import { AddressImportFlow } from './AddressImportFlow';
import { getFirstNMnemonicWallets } from './getFirstNMnemonicWallets';

function useMnenomicPhraseForLocation({
  locationStateStore,
}: {
  locationStateStore: MemoryLocationState;
}) {
  /**
   * Get phrase from
   * - either locationState
   * - or resolve from groupId in searchParams
   */
  const { value: phraseFromState } = useMemoryLocationState(locationStateStore);
  const [params] = useSearchParams();
  const groupId = params.get('groupId');
  if (!phraseFromState && !groupId) {
    throw new Error('View data expired');
  }
  const getRecoveryPhraseQuery = useQuery({
    queryKey: [`getRecoveryPhrase(${groupId})`],
    queryFn: async () => {
      const mnemonic = await walletPort.request('getRecoveryPhrase', {
        groupId: groupId as string, // can cast to string cause of "enabled" option
      });
      if (!mnemonic) {
        throw new Error(`Missing mnemonic for ${groupId}`);
      }
      return mnemonic.phrase;
    },
    enabled: !phraseFromState,
    retry: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    useErrorBoundary: true,
  });
  if (phraseFromState) {
    return { phrase: phraseFromState, isLoading: false, isError: false };
  } else {
    return {
      phrase: getRecoveryPhraseQuery.data,
      isLoading: getRecoveryPhraseQuery.isLoading,
      isError: getRecoveryPhraseQuery.isError,
    };
  }
}

const bgStyle = {
  ['--surface-background-color']: 'var(--z-index-0)',
} as React.CSSProperties;
export function MnemonicImportView({
  locationStateStore,
}: {
  locationStateStore: MemoryLocationState;
}) {
  const { phrase, isLoading: isLoadingPhrase } = useMnenomicPhraseForLocation({
    locationStateStore,
  });
  const { data } = useQuery({
    queryKey: ['getFirstNMnemonicWallets', phrase],
    queryFn: async (): Promise<{
      derivedWallets: DerivedWallets;
      addressesToCheck: string[];
    } | void> => {
      if (!phrase) {
        return;
      }

      const fn = getFirstNMnemonicWallets;
      const [eth, sol1, sol2, sol3] = await Promise.all([
        fn({ phrase, n: 30, curve: 'ecdsa' }),
        /** We want to explore all derivation paths in case there are active addresses */
        fn({ phrase, n: 30, curve: 'ed25519', pathType: 'solanaBip44Change' }),
        fn({ phrase, n: 30, curve: 'ed25519', pathType: 'solanaBip44' }),
        fn({ phrase, n: 30, curve: 'ed25519', pathType: 'solanaDeprecated' }),
      ]);
      const derivedWallets = [
        { curve: 'ecdsa' as const, pathType: 'bip44' as const, wallets: eth },
        {
          curve: 'ed25519' as const,
          pathType: 'solanaBip44Change' as const,
          wallets: sol1,
        },
        {
          curve: 'ed25519' as const,
          pathType: 'solanaBip44' as const,
          wallets: sol2,
        },
        {
          curve: 'ed25519' as const,
          pathType: 'solanaDeprecated' as const,
          wallets: sol3,
        },
      ];
      const WALLETS_TO_CHECK_PER_PATH = 10; // this number is small to reduce load on backend
      return {
        derivedWallets,
        addressesToCheck: derivedWallets.flatMap((config) =>
          config.wallets
            .slice(0, WALLETS_TO_CHECK_PER_PATH)
            .map((w) => w.address)
        ),
      };
    },
    enabled: Boolean(phrase),
    useErrorBoundary: true,
  });
  const { value } = useAddressActivity(
    { addresses: data?.addressesToCheck || [] },
    { enabled: Boolean(data?.addressesToCheck), keepStaleData: true }
  );
  const { isStale: isStaleValue } = useStaleTime(value, 3000);
  const shouldWaitForValue = value == null && !isStaleValue;
  useBackgroundKind({ kind: 'white' });
  useBodyStyle(bgStyle);
  return (
    <>
      <NavigationTitle title={null} documentTitle="Wallets Ready to Import" />
      {isLoadingPhrase || shouldWaitForValue || data == null ? (
        <PageColumn>
          <PageTop />
          <ViewLoading />
          <PageBottom />
        </PageColumn>
      ) : (
        <AddressImportFlow
          wallets={data.derivedWallets}
          activeWallets={value ?? {}}
        />
      )}
    </>
  );
}

import { useSubscription } from 'defi-sdk';
import React, { useMemo, useState } from 'react';
import { useQuery } from 'react-query';
import { useSearchParams } from 'react-router-dom';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { PageBottom } from 'src/ui/components/PageBottom';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { ViewLoading } from 'src/ui/components/ViewLoading';
import { walletPort } from 'src/ui/shared/channels';
import {
  MemoryLocationState,
  useMemoryLocationState,
} from '../memoryLocationState';
import { AddressImportFlow } from './AddressImportFlow';
import { getFirstNMnemonicWallets } from './getFirstNMnemonicWallets';
import { useStaleTime } from './useStaleTime';

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
  const getRecoveryPhraseQuery = useQuery(
    `getRecoveryPhrase(${groupId})`,
    async () => {
      const mnemonic = await walletPort.request('getRecoveryPhrase', {
        groupId: groupId as string, // can cast to string cause of "enabled" option
      });
      if (!mnemonic) {
        throw new Error(`Missing mnemonic for ${groupId}`);
      }
      return mnemonic.phrase;
    },
    {
      enabled: !phraseFromState,
      retry: false,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      useErrorBoundary: true,
    }
  );
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

export function MnemonicImportView({
  locationStateStore,
}: {
  locationStateStore: MemoryLocationState;
}) {
  const [count] = useState(100);
  const { phrase, isLoading: isLoadingPhrase } = useMnenomicPhraseForLocation({
    locationStateStore,
  });
  const { data: wallets } = useQuery(
    `getFirstNMnemonicWallets(${phrase}, ${count})`,
    async () =>
      phrase ? getFirstNMnemonicWallets({ phrase, n: count }) : undefined,
    { enabled: Boolean(phrase), useErrorBoundary: true }
  );
  const { value } = useSubscription<
    Record<string, { address: string; active: boolean }>,
    'address',
    'activity'
  >({
    namespace: 'address',
    enabled: Boolean(wallets),
    body: useMemo(
      () => ({
        scope: ['activity'],
        payload: wallets ? { addresses: wallets.map((w) => w.address) } : {},
      }),
      [wallets]
    ),
    keepStaleData: true,
  });
  const { isStale: isStaleValue } = useStaleTime(value, 3000);
  const shouldWaitForValue = value == null && !isStaleValue;
  return (
    <>
      <NavigationTitle title="Wallets Ready to Import" />
      {isLoadingPhrase || shouldWaitForValue || wallets == null ? (
        <PageColumn>
          <PageTop />
          <ViewLoading />
          <PageBottom />
        </PageColumn>
      ) : (
        <AddressImportFlow wallets={wallets} activeWallets={value ?? {}} />
      )}
    </>
  );
}

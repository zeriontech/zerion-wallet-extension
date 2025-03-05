import React, { useState } from 'react';
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
import type { MemoryLocationState } from '../memoryLocationState';
import { useMemoryLocationState } from '../memoryLocationState';
import { AddressImportFlow } from './AddressImportFlow';
import { getFirstNMnemonicWallets } from './getFirstNMnemonicWallets';
import { useBackgroundKind } from 'src/ui/components/Background';

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

function mix<T>(arr1: T[], arr2: T[]) {
  const res: T[] = [];
  while (arr1.length || arr2.length) {
    if (arr1.length) {
      res.push(arr1.shift() as T);
    }
    if (arr2.length) {
      res.push(arr2.shift() as T);
    }
  }
  return res;
}

export function MnemonicImportView({
  locationStateStore,
}: {
  locationStateStore: MemoryLocationState;
}) {
  const [count] = useState(50);
  const { phrase, isLoading: isLoadingPhrase } = useMnenomicPhraseForLocation({
    locationStateStore,
  });
  const { data: wallets } = useQuery({
    queryKey: ['getFirstNMnemonicWallets', phrase, count],
    queryFn: async () => {
      if (!phrase) {
        return;
      }
      const n = count;
      const a = await getFirstNMnemonicWallets({ phrase, n, curve: 'ecdsa' });
      const b = await getFirstNMnemonicWallets({ phrase, n, curve: 'ed25519' });
      return mix(a, b);
    },

    enabled: Boolean(phrase),
    useErrorBoundary: true,
  });
  const { value } = useAddressActivity(
    { addresses: wallets?.map((w) => w.address) || [] },
    { enabled: Boolean(wallets), keepStaleData: true }
  );
  const { isStale: isStaleValue } = useStaleTime(value, 3000);
  const shouldWaitForValue = value == null && !isStaleValue;
  useBackgroundKind({ kind: 'white' });
  return (
    <>
      <NavigationTitle title={null} documentTitle="Wallets Ready to Import" />
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

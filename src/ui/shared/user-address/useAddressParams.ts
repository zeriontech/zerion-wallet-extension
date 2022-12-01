import type { AddressParams } from 'defi-sdk';
import { useMemo } from 'react';
import { useQuery } from 'react-query';
import { walletPort } from '../channels';

interface Result {
  params: AddressParams;
  singleAddress: string;
  maybeSingleAddress: string | null;
  ready: boolean;
  isLoading: boolean;
  refetch: () => void;
}

export function useAddressParams(): Result {
  const {
    data: addressResult,
    isLoading,
    refetch,
  } = useQuery(
    'wallet/getCurrentAddress',
    () =>
      walletPort
        .request('getCurrentAddress')
        .then((result) => result?.toLowerCase() || null),
    { useErrorBoundary: true }
  );
  const address = addressResult || '';
  return {
    params: useMemo(() => ({ address }), [address]),
    maybeSingleAddress: address || null,
    singleAddress: address,
    ready: Boolean(address),
    isLoading,
    refetch,
  };
}

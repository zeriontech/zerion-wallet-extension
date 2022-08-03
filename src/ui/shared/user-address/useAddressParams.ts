import type { AddressParams } from 'defi-sdk';
import { useMemo } from 'react';
import { useQuery } from 'react-query';
import { walletPort } from '../channels';

interface Result {
  params: AddressParams;
  singleAddress: string;
  ready: boolean;
  refetch: () => void;
}

export function useAddressParams(): Result {
  const { data: addressResult, refetch } = useQuery(
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
    singleAddress: address,
    ready: Boolean(address),
    refetch,
  };
}

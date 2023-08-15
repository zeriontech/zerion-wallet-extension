import type { AddressParams } from 'defi-sdk';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import { walletPort } from 'src/ui/shared/channels';

interface Result {
  params: AddressParams;
  singleAddressNormalized: string;
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
  } = useQuery({
    queryKey: ['wallet/getCurrentAddress'],
    queryFn: () =>
      walletPort.request('getCurrentAddress').then((result) => result || null),
    useErrorBoundary: true,
  });
  const address = addressResult || '';
  const addressNormalized = normalizeAddress(address);
  return {
    params: useMemo(
      () => ({ address: addressNormalized }),
      [addressNormalized]
    ),
    singleAddressNormalized: addressNormalized,
    maybeSingleAddress: address || null,
    singleAddress: address,
    ready: Boolean(address),
    isLoading,
    refetch,
  };
}

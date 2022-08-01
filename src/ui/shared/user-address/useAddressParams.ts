import type { AddressParams } from 'defi-sdk';
import { useMemo } from 'react';
import { useQuery } from 'react-query';
import { walletPort } from '../channels';

interface Result {
  params: AddressParams;
  singleAddress: string;
  ready: boolean;
}

export function useAddressParams(): Result {
  const { data: wallet } = useQuery(
    'wallet',
    () => walletPort.request('getCurrentWallet'),
    { useErrorBoundary: true }
  );
  const address = wallet?.address.toLowerCase() || '';
  return {
    params: useMemo(() => ({ address }), [address]),
    singleAddress: address,
    ready: Boolean(address),
  };
}

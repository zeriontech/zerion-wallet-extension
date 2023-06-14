import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { lookupAddressName } from 'src/modules/name-service';
import type { BareWallet } from 'src/shared/types/BareWallet';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import { getWalletDisplayName } from './getWalletDisplayName';

const testAddress = process.env.TEST_WALLET_ADDRESS as string;

export function useProfileName(
  wallet: Pick<BareWallet, 'address' | 'name'>,
  {
    padding = 4,
    maxCharacters,
  }: { padding?: number; maxCharacters?: number } = {}
) {
  const { isLoading: isDomainLoading, data: domain } = useQuery({
    queryKey: ['name-service/lookupAddressName', wallet.address],
    queryFn: useCallback(
      () => lookupAddressName(wallet.address),
      [wallet.address]
    ),
    enabled: !wallet.name,
    suspense: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retryOnMount: false,
    retry: 0,
    staleTime: 2000,
  });

  const domainName = isDomainLoading ? null : domain;

  if (wallet.name) {
    return getWalletDisplayName(wallet, { padding, maxCharacters });
  }
  const value =
    domainName ?? getWalletDisplayName(wallet, { padding, maxCharacters });
  if (normalizeAddress(wallet.address) === testAddress) {
    return `${value} 🤘️️️️️️`;
  }
  return value;
}

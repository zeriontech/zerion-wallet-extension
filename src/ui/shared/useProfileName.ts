import { useCallback } from 'react';
import { useQuery } from 'react-query';
import { lookupAddressName } from 'src/modules/name-service';
import type { BareWallet } from 'src/shared/types/BareWallet';
import { getWalletDisplayName } from './getWalletDisplayName';

export function useProfileName(
  wallet: Pick<BareWallet, 'address' | 'name'>,
  {
    padding = 4,
    maxCharacters,
  }: { padding?: number; maxCharacters?: number } = {}
) {
  const { isLoading: isDomainLoading, data: domain } = useQuery(
    ['name-service/lookupAddressName', wallet.address],
    useCallback(() => lookupAddressName(wallet.address), [wallet.address]),
    {
      suspense: false,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      retryOnMount: false,
      retry: 0,
    }
  );

  const domainName = isDomainLoading ? null : domain;

  return wallet.name
    ? getWalletDisplayName(wallet, { padding, maxCharacters })
    : domainName ?? getWalletDisplayName(wallet, { padding, maxCharacters });
}

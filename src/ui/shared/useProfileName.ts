import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { lookupAddressName } from 'src/modules/name-service';
import type { BareWallet } from 'src/shared/types/BareWallet';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import { getWalletDisplayName } from './getWalletDisplayName';

const testAddress = process.env.TEST_WALLET_ADDRESS as string;

function randomCoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const testWalletSuffixes = ['⧗', '🤘️️️️️️', '♥️'];
const testWalletSuffix = randomCoice(testWalletSuffixes);

export enum WalletNameType {
  address,
  domain,
  customName,
}

export function useProfileName(
  wallet: Pick<BareWallet, 'address' | 'name'>,
  {
    padding = 4,
    maxCharacters,
  }: { padding?: number; maxCharacters?: number } = {}
): { type: WalletNameType; value: string } {
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
    useErrorBoundary: false,
  });

  const domainName = isDomainLoading ? null : domain;

  if (wallet.name) {
    return {
      type: WalletNameType.customName,
      value: getWalletDisplayName(wallet, { padding, maxCharacters }),
    };
  }
  const value =
    domainName ?? getWalletDisplayName(wallet, { padding, maxCharacters });
  const type = domainName ? WalletNameType.domain : WalletNameType.address;
  if (normalizeAddress(wallet.address) === testAddress) {
    return { type, value: `${value} ${testWalletSuffix}` };
  }
  return { type, value };
}

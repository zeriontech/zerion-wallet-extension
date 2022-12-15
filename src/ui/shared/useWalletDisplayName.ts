import { useCallback } from 'react';
import { useQuery } from 'react-query';
import { lookupAddressName } from 'src/modules/name-service';
import { getWalletDisplayName } from './getWalletDisplayName';

export function useWalletDisplayName(
  address: string,
  name?: string | null,
  {
    padding = 4,
    maxCharacters,
  }: { padding?: number; maxCharacters?: number } = {}
) {
  const { isLoading: isDomainLoading, data: domain } = useQuery(
    ['name-service/lookupAddressName', address],
    useCallback(() => lookupAddressName(address), [address])
  );

  const domainName = isDomainLoading ? null : domain;
  return (
    name ??
    domainName ??
    getWalletDisplayName(address, name, { padding, maxCharacters })
  );
}

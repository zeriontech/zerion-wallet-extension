import { useCallback } from 'react';
import { useQuery } from 'react-query';
import { lookupAddressName } from 'src/modules/name-service';
import { truncateAddress } from './truncateAddress';

export function emojify(value: string) {
  const lowerCase = value.toLowerCase();
  if (
    lowerCase.includes('hacked') ||
    lowerCase.includes('leaked') ||
    lowerCase.includes('lost')
  ) {
    return `${value} 😱`;
  } else {
    return value;
  }
}

interface Options {
  name?: string | null;
  padding?: number;
  maxCharacters?: number;
}

export function useWalletDisplayName(
  address: string,
  { name, padding = 4, maxCharacters }: Options = {}
) {
  const { isLoading: isDomainLoading, data: domain } = useQuery(
    ['name-service/lookupAddressName', address],
    useCallback(() => lookupAddressName(address), [address])
  );

  const domainName = isDomainLoading ? null : domain;
  const displayName = name ?? domainName ?? truncateAddress(address, padding);
  const value = emojify(displayName);

  if (maxCharacters && value.length > maxCharacters) {
    return truncateAddress(value, Math.floor((maxCharacters - 1) / 2));
  } else {
    return value;
  }
}

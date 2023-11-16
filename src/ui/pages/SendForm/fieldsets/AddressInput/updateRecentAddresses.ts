import { normalizeAddress } from 'src/shared/normalizeAddress';

const MAX_RECENT_ADDRESSES_SIZE = 16;

export function updateRecentAddresses(
  to: string,
  recentAddresses: string[]
): string[] {
  const normalizedAddress = normalizeAddress(to);
  const addressIndex = recentAddresses.findIndex(
    (item) => item === normalizedAddress
  );
  if (addressIndex >= 0) {
    return [
      normalizedAddress,
      ...recentAddresses.slice(0, addressIndex),
      ...recentAddresses.slice(addressIndex + 1, MAX_RECENT_ADDRESSES_SIZE),
    ];
  }
  return [
    normalizedAddress,
    ...recentAddresses.slice(0, MAX_RECENT_ADDRESSES_SIZE - 1),
  ];
}

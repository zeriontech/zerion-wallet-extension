import { useMemo } from 'react';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import { useAddressBook } from 'src/ui/features/address-book';
import { useWalletsMetaByChunks } from 'src/ui/shared/requests/useWalletsMetaByChunks';
import { useReceiverAddressItems } from './useReceiverAddressItems';

export function useReceiverDisplayName(address: string | null | undefined): {
  addressBookName: string | null;
  walletName: string | null;
  handle: string | null;
  avatarUrl: string | null;
  isInAddressBook: boolean;
} {
  const normalized = address ? normalizeAddress(address) : null;
  const { find } = useAddressBook();
  const { walletItems, watchlistItems } = useReceiverAddressItems();

  const { data: walletMetaList } = useWalletsMetaByChunks({
    addresses: normalized ? [normalized] : [],
    enabled: Boolean(normalized),
    suspense: false,
    useErrorBoundary: false,
    staleTime: 1000 * 60 * 10,
  });

  return useMemo(() => {
    if (!normalized) {
      return {
        addressBookName: null,
        walletName: null,
        handle: null,
        avatarUrl: null,
        isInAddressBook: false,
      };
    }
    const entry = find(normalized);
    const walletItem =
      walletItems.find((item) => item.address === normalized) ||
      watchlistItems.find((item) => item.address === normalized) ||
      null;
    const meta = walletMetaList?.at(0) ?? null;
    return {
      addressBookName: entry?.name || null,
      walletName: walletItem?.name || null,
      handle: meta?.identities?.[0]?.handle || null,
      avatarUrl: meta?.nft?.previewUrl || null,
      isInAddressBook: Boolean(entry),
    };
  }, [normalized, find, walletItems, watchlistItems, walletMetaList]);
}

/**
 * Best human-friendly name for an address — address book entry, then the
 * user's own wallet/watchlist name, then a domain handle (ENS/Lens/UD).
 * Returns `null` when none is found, so callers can fall back to a truncated
 * address themselves.
 */
export function useReceiverName(
  address: string | null | undefined
): string | null {
  const { addressBookName, walletName, handle } =
    useReceiverDisplayName(address);
  return addressBookName || walletName || handle || null;
}

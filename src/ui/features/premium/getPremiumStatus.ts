import { normalizeAddress } from 'src/shared/normalizeAddress';
import type { WalletMeta } from 'src/modules/zerion-api/requests/wallet-get-meta';
import { useAllSignerOrHwAddresses } from 'src/ui/shared/requests/useAllExistingAddresses';
import { useWalletsMetaByChunks } from 'src/ui/shared/requests/useWalletsMetaByChunks';
import { useMemo } from 'react';

/**
 * Premium status can be granted in 2 ways:
 * 1. By having a Restricted plan in the current address
 * 2. By having a non-Restricted plan in any of the imported or connected wallets
 */
function getPremiumStatus({
  normalizedAddress,
  walletsMeta,
}: {
  normalizedAddress?: string;
  walletsMeta: WalletMeta[];
}) {
  return walletsMeta.some((meta) => {
    if (
      meta.membership.premium &&
      meta.membership.premium?.plan !== 'Restricted'
    ) {
      return true;
    }
    if (
      normalizedAddress &&
      Boolean(meta.membership.premium) &&
      normalizeAddress(meta.address) === normalizedAddress
    ) {
      return true;
    }
    return false;
  });
}

/**
 * Premium status of any address can be taken into account only in case it is imported or connected from a HW
 * This is why we fetch wallet meta only for imported or connected wallets
 * If `address` is not passed, application's global premium status will be returned
 */
export function usePremiumStatus({ address }: { address?: string }) {
  const normalizedAddress = address ? normalizeAddress(address) : undefined;
  const addresses = useAllSignerOrHwAddresses();

  const walletsMetaQuery = useWalletsMetaByChunks({
    addresses: addresses || [],
    enabled: Boolean(addresses?.length),
    suspense: false,
    useErrorBoundary: false,
  });

  return {
    isPremium: useMemo(
      () =>
        getPremiumStatus({
          normalizedAddress,
          walletsMeta: walletsMetaQuery.data || [],
        }),
      [normalizedAddress, walletsMetaQuery.data]
    ),
    walletsMetaQuery,
  };
}

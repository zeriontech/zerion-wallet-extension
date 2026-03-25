import { useCallback, useMemo } from 'react';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import type { WalletMeta } from 'src/modules/zerion-api/requests/wallet-get-meta';
import type { AnyWallet } from './shared';

export function useWalletSearchPredicate({
  searchQuery,
  walletsMeta,
}: {
  searchQuery: string;
  walletsMeta: WalletMeta[] | undefined;
}): (wallet: AnyWallet) => boolean {
  const handlesMap = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const meta of walletsMeta ?? []) {
      const handles = meta.identities.map((id) => id.handle);
      if (handles.length) {
        map.set(normalizeAddress(meta.address), handles);
      }
    }
    return map;
  }, [walletsMeta]);

  return useCallback(
    (wallet: AnyWallet) => {
      const query = searchQuery.trim().toLowerCase();
      if (!query) return true;

      if (wallet.address.toLowerCase().includes(query)) return true;
      if (wallet.name?.toLowerCase().includes(query)) return true;

      const handles = handlesMap.get(normalizeAddress(wallet.address));
      if (handles?.some((h) => h.toLowerCase().includes(query))) return true;

      return false;
    },
    [searchQuery, handlesMap]
  );
}

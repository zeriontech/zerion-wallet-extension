import { useMemo } from 'react';
import type { BareWallet } from 'src/shared/types/BareWallet';

export function useWalletParams(wallet: BareWallet | null | undefined) {
  return useMemo(() => {
    if (!wallet) {
      return null;
    }
    const params = new URLSearchParams({
      addWallet: wallet.address,
      addWalletProvider: 'zerion-extension',
    });
    if (wallet.name) {
      params.append('addWalletName', wallet.name);
    }
    return params;
  }, [wallet]);
}

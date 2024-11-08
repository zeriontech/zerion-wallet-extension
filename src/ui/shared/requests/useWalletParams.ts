import { useMemo } from 'react';
import type { ExternallyOwnedAccount } from 'src/shared/types/ExternallyOwnedAccount';

export function getWalletParams(
  wallet: ExternallyOwnedAccount | null | undefined
) {
  if (!wallet) {
    return null;
  }
  const params = new URLSearchParams({
    addWallet: wallet.address,
    addWalletProvider: 'io.zerion.wallet',
  });
  if (wallet.name) {
    params.append('addWalletName', wallet.name);
  }
  return params;
}

export function useWalletParams(
  wallet: ExternallyOwnedAccount | null | undefined
) {
  return useMemo(() => getWalletParams(wallet), [wallet]);
}

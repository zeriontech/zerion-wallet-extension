import { isBareWallet, isDeviceAccount } from 'src/shared/types/validators';
import { useWalletByAddress } from './useConfidentialPermits';

/**
 * A wallet can Reveal if it can produce a Signed Permit: bare (mnemonic /
 * private-key) wallets sign silently in the background, Ledger wallets sign
 * on the device. Readonly and watched wallets get masks and the explain-only
 * dialog. `null` while the wallet is loading.
 */
export function useIsSignableWallet(
  address: string | null | undefined
): boolean | null {
  const { data: wallet, isFetched } = useWalletByAddress(address);
  if (!isFetched) {
    return null;
  }
  return Boolean(wallet && (isBareWallet(wallet) || isDeviceAccount(wallet)));
}

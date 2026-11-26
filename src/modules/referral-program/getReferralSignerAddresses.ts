import type { WalletGroup } from 'src/shared/types/WalletGroup';
import { isBareWallet, isSignerContainer } from 'src/shared/types/validators';

export function getReferralSignerAddresses(groups: WalletGroup[] | null): string[] {
  return (
    groups?.flatMap(({ walletContainer }) =>
      isSignerContainer(walletContainer)
        ? walletContainer.wallets.filter(isBareWallet).map((wallet) => wallet.address)
        : [],
    ) ?? []
  );
}

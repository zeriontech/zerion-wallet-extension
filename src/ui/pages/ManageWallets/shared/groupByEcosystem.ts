import { group } from 'moderndash';
import type { WalletGroup } from 'src/shared/types/WalletGroup';
import { getAddressType } from 'src/shared/wallet/classifiers';

export function groupByEcosystem(wallets: WalletGroup['walletContainer']['wallets']) {
  return group(wallets, (wallet) => getAddressType(wallet.address)) as Record<
    ReturnType<typeof getAddressType>,
    typeof wallets
  >;
}

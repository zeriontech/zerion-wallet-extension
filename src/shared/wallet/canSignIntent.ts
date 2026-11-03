import type { WalletGroup } from 'src/shared/types/WalletGroup';
import type { BlockchainType } from 'src/shared/wallet/classifiers';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import {
  isHardwareContainer,
  isMnemonicContainer,
  isPrivateKeyContainer,
} from 'src/shared/types/validators';

/** Set an ecosystem to false to give Ledger users classic quotes there */
export const LEDGER_INTENT_ECOSYSTEMS: Record<BlockchainType, boolean> = {
  evm: true,
  solana: true,
};

export function canSignIntent({
  walletGroups,
  from,
  ecosystem,
}: {
  walletGroups: WalletGroup[] | null | undefined;
  from: string;
  ecosystem: BlockchainType;
}): boolean {
  const address = normalizeAddress(from);
  const containers = (walletGroups ?? [])
    .map((group) => group.walletContainer)
    .filter((container) =>
      container.wallets.some(
        (wallet) => normalizeAddress(wallet.address) === address
      )
    );
  if (
    containers.some(
      (container) =>
        isMnemonicContainer(container) || isPrivateKeyContainer(container)
    )
  ) {
    return true;
  }
  if (containers.some(isHardwareContainer)) {
    return LEDGER_INTENT_ECOSYSTEMS[ecosystem];
  }
  return false;
}

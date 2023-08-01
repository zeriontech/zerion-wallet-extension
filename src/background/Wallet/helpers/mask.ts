import { produce } from 'immer';
import type { WalletGroup } from '../model/types';
import type { BareWallet } from '../model/BareWallet';
import type { ExternallyOwnedAccount } from '../model/accounts/types';

function maskMnemonic(
  mnemonic: BareWallet['mnemonic']
): BareWallet['mnemonic'] {
  return mnemonic ? { phrase: '<phrase>', path: mnemonic.path } : null;
}

export function maskWallet(wallet: ExternallyOwnedAccount | BareWallet) {
  return produce(wallet, (draft) => {
    if ('privateKey' in draft) {
      draft.privateKey = '<privateKey>';
      draft.mnemonic = maskMnemonic(draft.mnemonic);
    }
  });
}

export function maskWalletGroup(group: WalletGroup) {
  return produce(group, (draft) => {
    draft.walletContainer.wallets = draft.walletContainer.wallets.map(
      (wallet) => maskWallet(wallet)
    );
  });
}

export function maskWalletGroups(groups: WalletGroup[]): WalletGroup[] {
  return groups.map((group) => maskWalletGroup(group));
}

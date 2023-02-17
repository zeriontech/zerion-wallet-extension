import { Store } from 'store-unit';
import type { WalletGroup } from 'src/shared/types/WalletGroup';
import { normalizeAddress } from 'src/shared/normalizeAddress';

const testAddress = process.env.TEST_WALLET_ADDRESS as string;

interface State {
  hasTestWallet: boolean;
}

class MetaAppState extends Store<State> {
  updateState(state: Partial<State>) {
    this.setState((value) => ({ ...value, ...state }));
  }
}

export const metaAppState = new MetaAppState({
  hasTestWallet: false,
});

let timesChecked = 0;

export function checkForTestAddress(groups: WalletGroup[] | null) {
  if (timesChecked > 2) {
    return;
  }
  if (
    testAddress &&
    groups?.some((group) =>
      group.walletContainer.wallets.some(
        (wallet) =>
          normalizeAddress(wallet.address) === normalizeAddress(testAddress)
      )
    )
  ) {
    metaAppState.updateState({ hasTestWallet: true });
  }
  timesChecked++;
}

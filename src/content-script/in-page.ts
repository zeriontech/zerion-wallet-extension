import { EthereumProvider } from 'src/modules/ethereum/provider';
import { Connection } from 'src/modules/ethereum/connection';
import { WalletNameFlag } from 'src/shared/types/WalletNameFlag';
import type { GlobalPreferences } from 'src/shared/types/GlobalPreferences';
import { observeAndUpdatePageButtons } from './dapp-mutation';
import * as dappDetection from './dapp-detection';
import * as competingProviders from './competing-providers';
import { dappsWithoutCorrectEIP1193Support } from './dapp-configs';

declare global {
  interface Window {
    ethereum?: EthereumProvider;
    zerionWallet?: EthereumProvider;
  }
}

const scriptWithId = document.getElementById('zerion-extension-channel');
if (!scriptWithId) {
  throw new Error('script with id not found');
}

const walletChannelId = scriptWithId.dataset.walletChannelId;
scriptWithId.remove(); // Remove script to preserve initial DOM shape
if (!walletChannelId) {
  throw new Error(
    'walletChannelId must be defined as a data attribute on the script tag'
  );
}

const broadcastChannel = new BroadcastChannel(walletChannelId);
const connection = new Connection(broadcastChannel);
const provider = new EthereumProvider(connection);

provider.connect();

competingProviders.onBeforeAssignToWindow({
  foreignProvider: window.ethereum,
  ourProvider: provider,
});
dappDetection.initialize(provider);
dappDetection.onBeforeAssignToWindow(window.ethereum);
window.ethereum = provider;

Object.defineProperty(window, 'ethereum', {
  configurable: false, // explicitly set to false to disallow redefining the property by other wallets
  get() {
    dappDetection.onAccessThroughWindow(provider);
    return provider;
  },
  set(value: EthereumProvider) {
    dappDetection.handleForeignProvider(value);
    competingProviders.handleForeignProvider({
      foreignProvider: value,
      ourProvider: provider,
    });
  },
});

if (dappsWithoutCorrectEIP1193Support.has(window.location.origin)) {
  provider.isMetaMask = true;
}

provider
  .request({ method: 'wallet_getGlobalPreferences' })
  .then((preferences: GlobalPreferences) => {
    if (preferences.recognizableConnectButtons) {
      dappDetection.onDappDetected(observeAndUpdatePageButtons);
    }
  });

provider.request({ method: 'wallet_getWalletNameFlags' }).then((result) => {
  if (result.includes(WalletNameFlag.isMetaMask)) {
    provider.isMetaMask = true;
  }
});

window.zerionWallet = provider;

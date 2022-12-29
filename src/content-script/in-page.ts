import { EthereumProvider } from 'src/modules/ethereum/provider';
import { Connection } from 'src/modules/ethereum/connection';
import { WalletNameFlag } from 'src/shared/types/WalletNameFlag';
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

const currentScript = document.currentScript;
if (!currentScript) {
  throw new Error('document.currentScript not found');
}
const walletChannelId = currentScript.dataset.walletChannelId;
if (!walletChannelId) {
  throw new Error(
    'walletChannelId must be defined as a data attribute on the script tag'
  );
}
const broadcastChannel = new BroadcastChannel(walletChannelId);
const connection = new Connection(broadcastChannel);
const provider = new EthereumProvider(connection);

provider.connect();

dappDetection.onDappDetected(() => {
  observeAndUpdatePageButtons();
});

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

provider.request({ method: 'wallet_getWalletNameFlags' }).then((result) => {
  if (result.includes(WalletNameFlag.isMetaMask)) {
    provider.isMetaMask = true;
  }
});

window.zerionWallet = provider;

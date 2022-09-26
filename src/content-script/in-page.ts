import { EthereumProvider } from 'src/modules/ethereum/provider';
import { Connection } from 'src/modules/ethereum/connection';
import { WalletNameFlag } from 'src/shared/types/WalletNameFlag';

declare global {
  interface Window {
    myWalletChannelId: string;
    ethereum?: EthereumProvider;
    zerionWallet?: EthereumProvider;
  }
}

const broadcastChannel = new BroadcastChannel(window.myWalletChannelId);
const connection = new Connection(broadcastChannel);
const provider = new EthereumProvider(connection);

provider.connect();

window.ethereum = provider;

// TODO:
// Expose other providers similar to how coinbase wallet extension does it:
// https://docs.cloud.coinbase.com/wallet-sdk/docs/injected-provider-guidance
const otherProviders = new Set();

Object.defineProperty(window, 'ethereum', {
  configurable: false, // explicitly set to false to disallow redefining the property by other wallets
  get() {
    return provider;
  },
  set(value: EthereumProvider) {
    otherProviders.add(value);
  },
});

provider.request({ method: 'wallet_getWalletNameFlags' }).then((result) => {
  if (result.includes(WalletNameFlag.isMetaMask)) {
    provider.isMetaMask = true;
  }
});

window.zerionWallet = provider;

import { EthereumProvider } from 'src/modules/ethereum/provider';
import { Connection } from 'src/modules/ethereum/connection';
import { WalletNameFlag } from 'src/shared/types/WalletNameFlag';
import type { GlobalPreferences } from 'src/shared/types/GlobalPreferences';
import { isObj } from 'src/shared/isObj';
import { pageObserver } from './dapp-mutation';
import * as dappDetection from './dapp-detection';
import * as competingProviders from './competing-providers';
import { dappsWithoutCorrectEIP1193Support } from './dapp-configs';
import { initializeEIP6963 } from './eip6963';

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

/**
 * Create Proxy to overwrite `eth_requestAccounts` method so that the background script
 * knows when the request is made using window.ethereum vs using EIP-6963
 */
const proxiedProvider = new Proxy(provider, {
  get(target, prop, receiver) {
    if (prop === 'request') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (...args: any[]) => {
        const payload = args[0];
        if (
          isObj(payload) &&
          'method' in payload &&
          payload.method === 'eth_requestAccounts' &&
          // If no other providers detected, it makes no sense to offer to choose other wallets
          competingProviders.hasOtherProviders()
        ) {
          return target.request(payload as { method: string }, {
            nonEip6963Request: true,
          });
        }
        return target.request(args[0], args[1]);
      };
    }
    return Reflect.get(target, prop, receiver);
  },
});
window.ethereum = proxiedProvider;

dappDetection.onChange(({ dappIsZerionAware }) => {
  if (dappIsZerionAware) {
    pageObserver.stop();
  }
});

Object.defineProperty(window, 'ethereum', {
  configurable: false, // explicitly set to false to disallow redefining the property by other wallets
  get() {
    dappDetection.onAccessThroughWindow();
    return proxiedProvider;
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
  provider.markAsMetamask();
}

initializeEIP6963(provider, {
  onRequestProvider: () => {
    // DApp supports EIP-6963
    pageObserver.stop();
  },
});

provider
  .request({ method: 'wallet_getGlobalPreferences' })
  .then((preferences: GlobalPreferences) => {
    if (preferences.recognizableConnectButtons) {
      dappDetection.onChange(({ dappDetected, dappIsZerionAware }) => {
        if (dappDetected && !dappIsZerionAware) {
          pageObserver.start();
        }
      });
    }
  });

provider
  .request({
    method: 'wallet_getWalletNameFlags',
    params: { origin: window.location.origin },
  })
  .then((result) => {
    if (result.includes(WalletNameFlag.isMetaMask)) {
      provider.markAsMetamask();
    }
  });

window.zerionWallet = provider;

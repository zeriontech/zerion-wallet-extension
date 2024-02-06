import { EthereumProvider } from 'src/modules/ethereum/provider';
import { Connection } from 'src/modules/ethereum/connection';
import type { GlobalPreferences } from 'src/shared/types/GlobalPreferences';
import { isMetamaskModeOn } from 'src/shared/preferences-helpers';
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
    if (typeof target[prop as keyof typeof target] === 'function') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (...args: any[]) => {
        if (competingProviders.hasOtherProviders()) {
          provider.nonEip6963Request = true;
        }

        // @ts-ignore
        const result = target[prop](...args);
        provider.nonEip6963Request = false;
        return result;
      };
    } else {
      return Reflect.get(target, prop, receiver);
    }
  },
});
window.ethereum = proxiedProvider;

dappDetection.onChange(({ dappIsZerionAware }) => {
  if (dappIsZerionAware) {
    // Some libs (such as rainbow) access "isZerion" flag
    // to filter out wallets, and it doesn't mean the dapp is showing
    // the connect button for Zerion specifically. This is why we
    // do not turn off the page observer. But we might change this later.
    // pageObserver.stop();
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

/**
 * Current strategy:
 * window.ethereum provider should:
 *   Appear as metamask by default
 *   if user explicitly disables this, then appear as zerion
 */
provider.markAsMetamask();
provider
  .request({
    method: 'wallet_getWalletNameFlags',
    params: { origin: window.location.origin },
  })
  .then((result) => {
    if (isMetamaskModeOn(result)) {
      provider.markAsMetamask();
    } else {
      provider.unmarkAsMetamask();
    }
  });

window.zerionWallet = provider;

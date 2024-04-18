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

let isPaused = false;

connection.on('walletEvent', (data) => {
  if (data.event === 'pauseInjection') {
    isPaused = true;
  }
});

provider.connect();

competingProviders.onBeforeAssignToWindow({
  foreignProvider: window.ethereum,
  ourProvider: provider,
});
dappDetection.initialize(provider);
dappDetection.onBeforeAssignToWindow(window.ethereum);

/**
 * Create a proxy object to overwrite all provider methods so that the background script
 * knows when the request is made using window.ethereum vs using EIP-6963
 * Originally I tried to use the Proxy global, but for some reason
 * on https://stargate.finance/ this lead to "max call stack" error.
 * The following monkey-patch approach seems to work everywhere.
 */
const patchedProvider = Object.create(provider);
for (const untypedKey in provider) {
  const key = untypedKey as keyof typeof provider;
  if (typeof provider[key] === 'function') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    patchedProvider[key] = (...args: any[]) => {
      if (competingProviders.hasOtherProviders()) {
        provider.nonEip6963Request = true;
      }

      // eslint-disable-next-line @typescript-eslint/ban-types
      const result = (provider[key] as Function)(...args);
      provider.nonEip6963Request = false;
      return result;
    };
  }
}

/**
 * Provide a way to automatically invoke the `request` method
 * of a foreign provider if user prefers "other wallet"
 */
provider.prefersOtherWalletStrategy = ({ request, originalError }) => {
  if (isPaused && competingProviders.hasOtherProviders()) {
    const otherProvider = competingProviders.getFirstOtherProvider();
    return (otherProvider as EthereumProvider).request(request);
  } else {
    throw originalError;
  }
};

const proxiedProvider = new Proxy(patchedProvider, {
  get(target, prop, receiver) {
    if (isPaused && competingProviders.hasOtherProviders()) {
      const otherProvider = competingProviders.getFirstOtherProvider();
      // @ts-ignore
      return otherProvider[prop];
    } else {
      return Reflect.get(target, prop, receiver);
    }
  },
  set(target, prop, value, receiver) {
    if (isPaused && competingProviders.hasOtherProviders()) {
      const otherProvider = competingProviders.getFirstOtherProvider();
      // @ts-ignore
      otherProvider[prop] = value;
      return true;
    } else {
      return Reflect.set(target, prop, value, receiver);
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

try {
  Object.defineProperty(window, 'ethereum', {
    configurable: false, // explicitly set to false to disallow redefining the property by other wallets
    get() {
      if (isPaused && competingProviders.hasOtherProviders()) {
        return competingProviders.getFirstOtherProvider();
      }
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
} catch {
  // eslint-disable-next-line no-console
  console.warn('Global ethereum object was not defined');
}

if (dappsWithoutCorrectEIP1193Support.has(window.location.origin)) {
  provider.markAsMetamask();
}

initializeEIP6963(provider, {
  onRequestProvider: () => {
    pageObserver.stop();
    dappDetection.registerEip6963SupportOnce(provider);
  },
  onAccessProvider: () => {
    pageObserver.stop();
    dappDetection.registerEip6963SupportOnce(provider);
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

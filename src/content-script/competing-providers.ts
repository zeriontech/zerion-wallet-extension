import type { EthereumProvider } from 'src/modules/ethereum/provider';

function makeNotConfigurable<T>(object: T) {
  if (!object || typeof object !== 'object') {
    return;
  }
  Object.keys(object).forEach((key) =>
    Object.defineProperty(object, key, { configurable: false })
  );
}

type ForeignProvider = EthereumProvider & { isRabby?: boolean };

interface Params {
  foreignProvider: ForeignProvider | undefined;
  ourProvider: EthereumProvider;
}

// TODO:
// Expose other providers similar to how coinbase wallet extension does it:
// https://docs.cloud.coinbase.com/wallet-sdk/docs/injected-provider-guidance
const otherProviders = new Set();

export function handleForeignProvider({
  foreignProvider,
  ourProvider,
}: Params) {
  otherProviders.add(foreignProvider);
  if (foreignProvider?.isRabby) {
    // Rabby does some weird stuff with reconfiguring some provider properties,
    // which leads to infinite recursion. To avoid that,
    // we disallow properties of our provider to be reconfigured
    makeNotConfigurable(ourProvider);
  }
}

export function onBeforeAssignToWindow(params: Params) {
  handleForeignProvider(params);
}

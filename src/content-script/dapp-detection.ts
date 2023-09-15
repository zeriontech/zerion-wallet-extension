import type { EthereumProvider } from 'src/modules/ethereum/provider';

let didHandleWindowAccess = false;
let dappDetectionIsPossible = true;

type ForeignProvider = EthereumProvider & { isRabby?: boolean };

const state = {
  dappDetected: false,
  dappIsZerionAware: false,
};

const listeners: Array<(value: typeof state) => void> = [];
const notify = () => listeners.forEach((l) => l(state));

export function onChange(listener: (value: typeof state) => void) {
  listeners.push(listener);
  if (state.dappDetected) {
    listener(state);
  }
}

function trackZerionFlagAccess(ourProvider: EthereumProvider) {
  Object.defineProperty(ourProvider, 'isZerion', {
    get() {
      state.dappIsZerionAware = true;
      notify();
      return ourProvider.isMetaMask ? undefined : true;
    },
  });
}

export async function initialize(ourProvider: EthereumProvider) {
  trackZerionFlagAccess(ourProvider);
  const isDapp = await ourProvider.request({ method: 'wallet_isKnownDapp' });
  if (isDapp) {
    state.dappDetected = true;
    notify();
  }
}

export function handleForeignProvider(provider: ForeignProvider) {
  if (provider.isRabby) {
    // rabby tries to access window.ethereum as well as all its properties,
    // making dapp detection impossible
    dappDetectionIsPossible = false;
  }
}

export function onBeforeAssignToWindow(provider: ForeignProvider | undefined) {
  if (provider) {
    handleForeignProvider(provider);
  }
}

export function onAccessThroughWindow() {
  if (!didHandleWindowAccess) {
    didHandleWindowAccess = true;
    if (dappDetectionIsPossible) {
      state.dappDetected = true;
      notify();
    }
  }
}

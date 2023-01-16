import type { EthereumProvider } from 'src/modules/ethereum/provider';

let didHandleWindowAccess = false;
let dappDetectionIsPossible = true;

type ForeignProvider = EthereumProvider & { isRabby?: boolean };

const listeners: Array<() => void> = [];
const notify = () => listeners.forEach((l) => l());

let dappDetected = false;

export function onDappDetected(listener: () => void) {
  listeners.push(listener);
  if (dappDetected) {
    listener();
  }
}

export async function initialize(ourProvider: EthereumProvider) {
  const isDapp = await ourProvider.request({
    method: 'wallet_isKnownDapp',
    params: { origin: window.location.origin },
  });
  if (isDapp) {
    dappDetected = true;
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

export function onAccessThroughWindow(ourProvider: EthereumProvider) {
  if (!didHandleWindowAccess) {
    didHandleWindowAccess = true;
    if (dappDetectionIsPossible) {
      dappDetected = true;
      notify();
      ourProvider.request({
        method: 'wallet_flagAsDapp',
        params: { origin: window.location.origin },
      });
    }
  }
}

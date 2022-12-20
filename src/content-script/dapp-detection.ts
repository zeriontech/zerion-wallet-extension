import type { EthereumProvider } from 'src/modules/ethereum/provider';

let didHandleWindowAccess = false;
let dappDetectionIsPossible = true;

type ForeignProvider = EthereumProvider & { isRabby?: boolean };

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
      ourProvider.request({
        method: 'wallet_flagAsDapp',
        params: { origin: window.location.origin },
      });
    }
  }
}

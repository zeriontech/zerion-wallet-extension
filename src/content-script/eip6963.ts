import type { EthereumProvider } from 'src/modules/ethereum/provider';
import zerionLogoDataUrl from 'data-url:src/ui/assets/zerion-logo-blue.svg';

interface EIP6963ProviderInfo {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
}

const info = {
  uuid: crypto.randomUUID(),
  name: 'Zerion',
  icon: zerionLogoDataUrl,
  rdns: 'io.zerion.wallet',
} satisfies EIP6963ProviderInfo;

export function initializeEIP6963(provider: EthereumProvider) {
  const announceEvent = new CustomEvent('eip6963:announceProvider', {
    detail: Object.freeze({ info, provider }),
  });
  window.dispatchEvent(announceEvent);

  window.addEventListener('eip6963:requestProvider', () => {
    window.dispatchEvent(announceEvent);
  });
}

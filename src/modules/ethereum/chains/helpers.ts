import { normalizeChainId } from 'src/shared/normalizeChainId';

export function getCustomNetworkId(chainId: string) {
  return `zerion-extension-${normalizeChainId(chainId)}`;
}

export function isCustomNetworkId(networkId: string) {
  return networkId.startsWith('zerion-extension-');
}

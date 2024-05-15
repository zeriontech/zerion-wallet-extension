import { normalizeChainId } from 'src/shared/normalizeChainId';

const CUSTOM_NETWORK_PREFIX = 'zerion-custom-network-';

export function toCustomNetworkId(chainId: string) {
  return `${CUSTOM_NETWORK_PREFIX}${normalizeChainId(chainId)}`;
}

export function isCustomNetworkId(networkId: string) {
  return networkId.startsWith(CUSTOM_NETWORK_PREFIX);
}

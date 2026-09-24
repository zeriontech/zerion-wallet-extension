import { normalizeChainId } from 'src/shared/normalizeChainId';

const CUSTOM_NETWORK_PREFIX = 'zerion-custom-network-';

export function toCustomNetworkId(chainId: string) {
  return `${CUSTOM_NETWORK_PREFIX}${normalizeChainId(chainId)}`;
}

export function isCustomNetworkId(networkId: string) {
  return networkId.startsWith(CUSTOM_NETWORK_PREFIX);
}

/**
 * Rewrites pinned ids that changed (custom id became a backend id, or the user
 * edited a custom network's chainId). Keeps the first position on collisions.
 */
export function remapPinnedChains(
  pinnedChains: string[] | undefined,
  idMap: Map<string, string>
) {
  if (!pinnedChains?.length || !idMap.size) {
    return pinnedChains;
  }
  return Array.from(new Set(pinnedChains.map((id) => idMap.get(id) ?? id)));
}

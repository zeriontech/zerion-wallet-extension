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

/**
 * Applies a new order of the visible pins to the stored list. Stored ids that
 * aren't visible (unresolved, other ecosystem or testnet mode) keep their slots.
 */
export function reorderPinnedChains(
  pinnedChains: string[],
  nextVisibleChains: string[]
) {
  const visible = new Set(nextVisibleChains);
  const slots = pinnedChains.flatMap((id, index) =>
    visible.has(id) ? [index] : []
  );
  if (slots.length !== nextVisibleChains.length) {
    return [
      ...nextVisibleChains,
      ...pinnedChains.filter((id) => !visible.has(id)),
    ];
  }
  const result = [...pinnedChains];
  slots.forEach((slot, index) => {
    result[slot] = nextVisibleChains[index];
  });
  return result;
}

import { useMemo } from 'react';
import type { Networks } from 'src/modules/networks/Networks';
import { createChain } from 'src/modules/networks/Chain';
import type { FungiblePosition } from 'src/modules/zerion-api/requests/wallet-get-simple-positions';

export interface TopNetworksEntry {
  chainId: string;
  name: string;
  iconUrl: string;
}

export function useTopNetworks(
  positions: FungiblePosition[],
  /** If set, ensures this chain is always included in the result */
  ensureChainId?: string | null,
  /** If set, ensures this chain is always included in the result */
  extraChainId?: string | null,
  options: {
    limit?: number;
    /** Always-present leftmost chip (e.g. Solana for the receive selector) */
    pinnedFirstChainId?: string | null;
    /** Chip to add when the derived list ends up empty */
    fallbackChainId?: string | null;
    /** Used to synthesise entries for chains the user has no positions on */
    networks?: Networks | null;
    /**
     * Ordered list of chain ids to top up the result to `limit` when the
     * user's positions don't cover enough chains. Resolved via `networks`.
     */
    padChainIds?: readonly string[];
  } = {}
): TopNetworksEntry[] {
  const {
    limit = 10,
    pinnedFirstChainId,
    fallbackChainId,
    networks,
    padChainIds,
  } = options;
  return useMemo(() => {
    const chainMap = new Map<
      string,
      { chainId: string; name: string; iconUrl: string; count: number }
    >();
    for (const position of positions) {
      const existing = chainMap.get(position.chain.id);
      if (existing) {
        existing.count += 1;
      } else {
        chainMap.set(position.chain.id, {
          chainId: position.chain.id,
          name: position.chain.name,
          iconUrl: position.chain.iconUrl,
          count: 1,
        });
      }
    }

    const lookupChain = (chainId: string): TopNetworksEntry | null => {
      const fromPositions = chainMap.get(chainId);
      if (fromPositions) {
        return {
          chainId: fromPositions.chainId,
          name: fromPositions.name,
          iconUrl: fromPositions.iconUrl,
        };
      }
      if (!networks) return null;
      const network = networks.getByNetworkId(createChain(chainId));
      if (!network) return null;
      return {
        chainId,
        name: network.name,
        iconUrl: network.icon_url ?? '',
      };
    };

    const sorted = Array.from(chainMap.values()).sort(
      (a, b) => b.count - a.count
    );
    let derived: TopNetworksEntry[] = sorted.slice(0, limit).map((e) => ({
      chainId: e.chainId,
      name: e.name,
      iconUrl: e.iconUrl,
    }));

    if (derived.length === 0 && fallbackChainId) {
      const fallback = lookupChain(fallbackChainId);
      if (fallback) derived.push(fallback);
    }

    for (const id of [ensureChainId, extraChainId]) {
      if (!id) continue;
      if (derived.some((n) => n.chainId === id)) continue;
      const entry = lookupChain(id);
      if (entry) derived.push(entry);
    }

    if (padChainIds && derived.length < limit) {
      for (const id of padChainIds) {
        if (derived.length >= limit) break;
        if (id === pinnedFirstChainId) continue;
        if (derived.some((n) => n.chainId === id)) continue;
        const entry = lookupChain(id);
        if (entry) derived.push(entry);
      }
    }

    if (pinnedFirstChainId) {
      derived = derived.filter((n) => n.chainId !== pinnedFirstChainId);
      const pinned = lookupChain(pinnedFirstChainId);
      if (pinned) derived.unshift(pinned);
    }

    return derived;
  }, [
    positions,
    ensureChainId,
    extraChainId,
    limit,
    pinnedFirstChainId,
    fallbackChainId,
    networks,
    padChainIds,
  ]);
}

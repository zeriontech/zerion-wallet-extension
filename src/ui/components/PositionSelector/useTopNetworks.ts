import { useMemo } from 'react';
import { isTruthy } from 'is-truthy-ts';
import type { Networks } from 'src/modules/networks/Networks';
import { createChain } from 'src/modules/networks/Chain';
import type { FungiblePosition } from 'src/modules/zerion-api/requests/wallet-get-simple-positions';

export interface TopNetworksEntry {
  chainId: string;
  name: string;
  iconUrl: string;
}

export interface TopNetworksOptions {
  limit?: number;
  /** Always-present leftmost chip (e.g. Solana for the receive selector) */
  pinnedFirstChainId?: string | null;
  /**
   * User-pinned chain ids, in the user's order. The caller filters them with
   * the same predicate as its network dialog. They are placed right after
   * `pinnedFirstChainId` and ahead of the positions-derived chips.
   */
  pinnedChainIds?: readonly string[];
  /** Chip to add when the derived list ends up empty */
  fallbackChainId?: string | null;
  /** Used to synthesise entries for chains the user has no positions on */
  networks?: Networks | null;
  /**
   * Ordered list of chain ids to top up the result to `limit` when the
   * user's positions don't cover enough chains. Resolved via `networks`.
   */
  padChainIds?: readonly string[];
}

export function getTopNetworks(
  positions: FungiblePosition[],
  ensureChainId: string | null | undefined,
  extraChainId: string | null | undefined,
  options: TopNetworksOptions = {}
): TopNetworksEntry[] {
  const {
    limit = 10,
    pinnedFirstChainId,
    pinnedChainIds,
    fallbackChainId,
    networks,
    padChainIds,
  } = options;
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
      iconUrl: network.iconUrl ?? '',
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

  if (pinnedChainIds?.length) {
    const pinned = pinnedChainIds
      .filter((id) => id !== pinnedFirstChainId)
      .map(lookupChain)
      .filter(isTruthy);
    const pinnedIds = new Set(pinned.map((n) => n.chainId));
    derived = [...pinned, ...derived.filter((n) => !pinnedIds.has(n.chainId))];
  }

  if (pinnedFirstChainId) {
    derived = derived.filter((n) => n.chainId !== pinnedFirstChainId);
    const pinned = lookupChain(pinnedFirstChainId);
    if (pinned) derived.unshift(pinned);
  }

  return derived;
}

export function useTopNetworks(
  positions: FungiblePosition[],
  /** If set, ensures this chain is always included in the result */
  ensureChainId?: string | null,
  /** If set, ensures this chain is always included in the result */
  extraChainId?: string | null,
  options: TopNetworksOptions = {}
): TopNetworksEntry[] {
  const {
    limit,
    pinnedFirstChainId,
    pinnedChainIds,
    fallbackChainId,
    networks,
    padChainIds,
  } = options;
  return useMemo(
    () =>
      getTopNetworks(positions, ensureChainId, extraChainId, {
        limit,
        pinnedFirstChainId,
        pinnedChainIds,
        fallbackChainId,
        networks,
        padChainIds,
      }),
    [
      positions,
      ensureChainId,
      extraChainId,
      limit,
      pinnedFirstChainId,
      pinnedChainIds,
      fallbackChainId,
      networks,
      padChainIds,
    ]
  );
}

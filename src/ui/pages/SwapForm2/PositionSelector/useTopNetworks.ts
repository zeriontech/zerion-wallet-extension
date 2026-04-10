import { useMemo } from 'react';
import type { FungiblePosition } from 'src/modules/zerion-api/requests/wallet-get-simple-positions';

export function useTopNetworks(
  positions: FungiblePosition[],
  /** If set, ensures this chain is always included in the result */
  ensureChainId?: string | null,
  limit = 5
) {
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
    const sorted = Array.from(chainMap.values()).sort(
      (a, b) => b.count - a.count
    );
    const top = sorted.slice(0, limit);

    // If the ensured chain isn't in the top list, append it
    if (ensureChainId && !top.some((n) => n.chainId === ensureChainId)) {
      const extra = chainMap.get(ensureChainId);
      if (extra) {
        top.push(extra);
      }
    }

    return top.map(({ chainId, name, iconUrl }) => ({
      chainId,
      name,
      iconUrl,
    }));
  }, [positions, ensureChainId, limit]);
}

import { useQueries, useQuery } from '@tanstack/react-query';
import type {
  PerpClearinghouseState,
  PerpPosition,
} from '../api/requests/perp-clearinghouse-state.types';
import type { DexIdentifier } from '../api/requests/perp-dexs.types';
import { clearinghouseStateQueryOptions } from './useClearinghouseState';
import { perpDexsQueryOptions } from './usePerpDexs';

interface UseClearinghouseStatesResult {
  isLoading: boolean;
  totalAccountValue: number;
  allPositions: PerpPosition[];
  // Same length as `allPositions`; `dexByPosition[i]` is the DEX that owns
  // `allPositions[i]` (undefined = main perp DEX).
  dexByPosition: DexIdentifier[];
  dexesWithPositions: DexIdentifier[];
  perpStatesByDex: Array<PerpClearinghouseState | null | undefined>;
  dexList: DexIdentifier[];
}

export function useClearinghouseStates(
  { address }: { address: string | null | undefined },
  { enabled = true }: { enabled?: boolean } = {}
): UseClearinghouseStatesResult {
  const { data: dexs, isLoading: dexsLoading } = useQuery({
    ...perpDexsQueryOptions,
    enabled,
  });

  // Until perpDexs resolves, optimistically query the main DEX so the UI
  // isn't empty during the dexs round-trip.
  const dexList: DexIdentifier[] = dexs ?? [undefined];

  const results = useQueries({
    queries: dexList.map((dex) =>
      address
        ? {
            ...clearinghouseStateQueryOptions({
              address,
              dexIdentifier: dex,
            }),
            enabled: enabled && Boolean(address) && Boolean(dexs),
            refetchInterval: 30_000,
          }
        : {
            ...clearinghouseStateQueryOptions({
              address: null,
              dexIdentifier: dex,
            }),
            enabled: false,
          }
    ),
  });

  const statesLoading = results.some((r) => r.isLoading);
  const isLoading =
    enabled && Boolean(address) && (dexsLoading || statesLoading);

  let totalAccountValue = 0;
  const perpStatesByDex: Array<PerpClearinghouseState | null | undefined> = [];
  const allPositions: PerpPosition[] = [];
  const dexByPosition: DexIdentifier[] = [];
  const dexesWithPositions: DexIdentifier[] = [];

  // Dedupe by (coin, szi) so a poisoned cache or upstream duplicate can't
  // produce duplicate React keys downstream while still allowing legitimate
  // long+short positions on the same coin (size sign differs).
  const seenPositionKeys = new Set<string>();

  for (let i = 0; i < dexList.length; i++) {
    const state = results[i]?.data;
    perpStatesByDex.push(state);
    if (!state) continue;

    const accountValue = Number(state.marginSummary.accountValue);
    if (!Number.isNaN(accountValue)) {
      totalAccountValue += accountValue;
    }

    const dedupedPositions: PerpPosition[] = [];
    for (const entry of state.assetPositions) {
      const key = `${entry.position.coin}|${entry.position.szi}`;
      if (seenPositionKeys.has(key)) continue;
      seenPositionKeys.add(key);
      dedupedPositions.push(entry.position);
    }

    if (dedupedPositions.length > 0) {
      dexesWithPositions.push(dexList[i]);
      for (const p of dedupedPositions) {
        allPositions.push(p);
        dexByPosition.push(dexList[i]);
      }
    }
  }

  // Sort by margin used, keeping dexByPosition aligned with allPositions.
  const order = allPositions
    .map((_, idx) => idx)
    .sort(
      (a, b) =>
        Number(allPositions[b].marginUsed) - Number(allPositions[a].marginUsed)
    );
  const sortedPositions = order.map((idx) => allPositions[idx]);
  const sortedDex = order.map((idx) => dexByPosition[idx]);

  return {
    isLoading,
    totalAccountValue,
    allPositions: sortedPositions,
    dexByPosition: sortedDex,
    dexesWithPositions,
    perpStatesByDex,
    dexList,
  };
}

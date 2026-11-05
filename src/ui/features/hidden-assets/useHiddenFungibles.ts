import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { GlobalPreferences } from 'src/shared/types/GlobalPreferences';
import { walletPort } from 'src/ui/shared/channels';
import { GLOBAL_PREFERENCES_QUERY_KEY } from 'src/ui/features/preferences/usePreferences';
import { normalizeHiddenFungibleIds } from 'src/modules/zerion-api/shared/hiddenFungibleIds';
import {
  addHiddenFungibleId,
  canHideMoreFungibles,
  removeHiddenFungibleId,
} from './hiddenFungibleIds';

/**
 * Reads the device-wide hidden list without forcing Suspense. Request hooks use
 * it to add the normalized ids to their params and query keys, and to stay
 * disabled until the background preference has loaded (so they never fire an
 * unfiltered request first).
 */
export function useHiddenFungibleIds() {
  const query = useQuery({
    queryKey: GLOBAL_PREFERENCES_QUERY_KEY,
    queryFn: () => walletPort.request('getGlobalPreferences'),
    suspense: false,
  });
  const rawHiddenFungibleIds = query.data?.hiddenFungibleIds ?? [];
  return {
    /** Stored order, untouched: the Hidden Assets list renders in this order. */
    rawHiddenFungibleIds,
    /** Wire shape: empty ids dropped, deduplicated and sorted. */
    hiddenFungibleIds: normalizeHiddenFungibleIds(rawHiddenFungibleIds),
    isReady: query.isSuccess,
    canHideMore: canHideMoreFungibles(rawHiddenFungibleIds),
  };
}

/**
 * Writes the hidden list. Optimistic: the cached preferences update at once so
 * every consumer's query key changes and its request refetches; on failure the
 * previous list is restored, and the background value is re-read on settle.
 */
export function useHiddenFungibleActions() {
  const queryClient = useQueryClient();
  const { rawHiddenFungibleIds } = useHiddenFungibleIds();

  const mutation = useMutation({
    mutationFn: (hiddenFungibleIds: string[]) =>
      walletPort.request('setGlobalPreferences', {
        preferences: { hiddenFungibleIds },
      }),
    onMutate: async (hiddenFungibleIds) => {
      await queryClient.cancelQueries({
        queryKey: GLOBAL_PREFERENCES_QUERY_KEY,
      });
      const previous = queryClient.getQueryData<GlobalPreferences>(
        GLOBAL_PREFERENCES_QUERY_KEY
      );
      queryClient.setQueryData<GlobalPreferences>(
        GLOBAL_PREFERENCES_QUERY_KEY,
        (preferences) =>
          preferences ? { ...preferences, hiddenFungibleIds } : preferences
      );
      // A list change is a request change, not a client-side filter. Mark the
      // wallet reads stale so a key we are returning to (unhide) refetches
      // instead of serving its pre-hide cached response.
      void Promise.all(
        [
          'walletGetPortfolio',
          'walletGetGroupedPositions',
          'walletGetChart',
          'walletGetPnl',
        ].map((queryKey) =>
          queryClient.invalidateQueries({ queryKey: [queryKey] })
        )
      );
      return { previous };
    },
    onError: (_error, _preferences, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          GLOBAL_PREFERENCES_QUERY_KEY,
          context.previous
        );
      }
    },
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: GLOBAL_PREFERENCES_QUERY_KEY,
      }),
  });

  const hide = useCallback(
    (id: string) => {
      const next = addHiddenFungibleId(rawHiddenFungibleIds, id);
      if (next == null) {
        return false;
      }
      if (next.length !== rawHiddenFungibleIds.length) {
        mutation.mutate(next);
      }
      return true;
    },
    [mutation, rawHiddenFungibleIds]
  );

  const unhide = useCallback(
    (id: string) => {
      const next = removeHiddenFungibleId(rawHiddenFungibleIds, id);
      if (next.length !== rawHiddenFungibleIds.length) {
        mutation.mutate(next);
      }
    },
    [mutation, rawHiddenFungibleIds]
  );

  return {
    hide,
    unhide,
    canHideMore: canHideMoreFungibles(rawHiddenFungibleIds),
  };
}

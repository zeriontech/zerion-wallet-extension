import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { GlobalPreferences } from 'src/shared/types/GlobalPreferences';
import { walletPort } from 'src/ui/shared/channels';
import { GLOBAL_PREFERENCES_QUERY_KEY } from 'src/ui/features/preferences/usePreferences';
import { useHiddenFungibleIds } from './useHiddenFungibles';

/**
 * Reads and marks the one-time spam-hint preference. Optimistic like the
 * hidden-list writes: the cached preferences flip immediately, a failed write
 * restores the previous value, and the background value is re-read on settle.
 */
export function useHideTokenHint() {
  const queryClient = useQueryClient();
  const { hasSeenHideTokenHint, isReady } = useHiddenFungibleIds();

  const mutation = useMutation({
    mutationFn: () =>
      walletPort.request('setGlobalPreferences', {
        preferences: { hasSeenHideTokenHint: true },
      }),
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: GLOBAL_PREFERENCES_QUERY_KEY,
      });
      const previous = queryClient.getQueryData<GlobalPreferences>(GLOBAL_PREFERENCES_QUERY_KEY);
      queryClient.setQueryData<GlobalPreferences>(GLOBAL_PREFERENCES_QUERY_KEY, (preferences) =>
        preferences ? { ...preferences, hasSeenHideTokenHint: true } : preferences,
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(GLOBAL_PREFERENCES_QUERY_KEY, context.previous);
      }
    },
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: GLOBAL_PREFERENCES_QUERY_KEY,
      }),
  });

  return {
    hasSeenHideTokenHint,
    isReady,
    markSeen: mutation.mutate,
  };
}

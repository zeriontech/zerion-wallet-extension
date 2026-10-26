import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  hashQueryKey,
  type InfiniteData,
  useInfiniteQuery,
} from '@tanstack/react-query';
import { queryClient } from 'src/ui/shared/requests/queryClient';
import { useConfidentialPermits } from 'src/ui/features/confidential-balances/useConfidentialPermits';
import { withPermits } from 'src/ui/features/confidential-balances/withPermits';
import {
  acquirePendingActionsPoll,
  canPollPending,
  documentVisibility,
  getPollPayload,
  hasPollablePending,
  startPendingActionsPoll,
} from 'src/ui/features/pending-transactions/pendingActionsPoll';
import { ZerionAPI } from '../zerion-api.client';
import type {
  Payload,
  Response as WalletActionsResponse,
} from '../requests/wallet-get-actions';
import { getPageRequestParams } from '../requests/getPageRequestParams';
import type { BackendSourceParams } from '../shared';

type LocalPendingRow = { id: string; timestamp: number };

export function useWalletActions(
  params: Payload,
  { source }: BackendSourceParams,
  {
    suspense = false,
    enabled = true,
    refetchInterval = false,
    localPending,
  }: {
    suspense?: boolean;
    enabled?: boolean;
    keepPreviousData?: boolean;
    refetchInterval?: number | false;
    /** Polls the pending lists while mounted; the rows are the local actions shown in Pending. */
    localPending?: LocalPendingRow[];
  } = {}
) {
  const { permits, fingerprint, isReady } = useConfidentialPermits(
    params.addresses
  );
  const queryKey = useMemo(
    () => ['walletGetActions', params, source, fingerprint],
    [params, source, fingerprint]
  );
  const queryData = useInfiniteQuery({
    // the permits fingerprint stands in for `permits` in the key: signatures themselves never go into a (persisted) query key
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey,
    queryFn: ({ pageParam }) =>
      withPermits(permits, (permits) =>
        ZerionAPI.walletGetActions(
          {
            ...getPageRequestParams(params, pageParam),
            permits,
            chain: params.chain || undefined,
          },
          { source }
        )
      ),
    enabled: enabled && isReady,
    suspense,
    getNextPageParam: (lastPage) =>
      lastPage?.meta?.pagination.cursor || undefined,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchInterval,
  });

  const actions = useMemo(() => {
    return queryData.data?.pages.flatMap((page) => page.data);
  }, [queryData.data]);

  const firstPage = queryData.data?.pages[0];

  // Slice data to the first page on refetch
  // Based on: https://github.com/TanStack/query/discussions/1670#discussioncomment-13006968
  const refetch = useCallback(() => {
    queryClient.setQueryData<InfiniteData<WalletActionsResponse>>(
      queryKey,
      (data) => ({
        pages: data?.pages.slice(0, 1) || [],
        pageParams: data?.pageParams.slice(0, 1) || [],
      })
    );
    queryClient.refetchQueries(queryKey);
  }, [queryKey]);

  const localPendingRef = useRef(localPending ?? []);
  localPendingRef.current = localPending ?? [];
  const pollEnabled =
    Boolean(localPending) && enabled && isReady && canPollPending(params);
  const hasData = Boolean(queryData.data);
  const backendPollable = hasPollablePending(queryData.data);
  const localPendingKey = (localPending ?? []).map((row) => row.id).join();

  useEffect(() => {
    if (!pollEnabled || !hasData || (!backendPollable && !localPendingKey)) {
      return;
    }
    return acquirePendingActionsPoll(hashQueryKey(queryKey), () =>
      startPendingActionsPoll({
        queryClient,
        queryKey,
        fetchFirstPage: (since) =>
          withPermits(permits, (permits) =>
            ZerionAPI.walletGetActions(
              {
                ...getPollPayload(params, since),
                permits,
                chain: params.chain || undefined,
              },
              { source }
            )
          ),
        visibility: documentVisibility,
        localPending: { getActions: () => localPendingRef.current },
      })
    );
    // permits are covered by the fingerprint in queryKey
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pollEnabled, hasData, backendPollable, localPendingKey, queryKey]);

  return {
    actions,
    pending: firstPage?.pending,
    unsigned: firstPage?.unsigned,
    pendingListsAvailable: firstPage?.pendingListsAvailable ?? false,
    refetch,
    queryData,
  };
}

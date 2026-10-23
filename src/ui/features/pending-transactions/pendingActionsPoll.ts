import type {
  InfiniteData,
  QueryClient,
  QueryKey,
} from '@tanstack/react-query';
import type {
  AddressAction,
  PendingAction,
  Payload as WalletActionsPayload,
  Response as WalletActionsResponse,
} from 'src/modules/zerion-api/requests/wallet-get-actions';

export const PENDING_POLL_INTERVAL = 3000;
export const LOCAL_PENDING_FAST_WINDOW_MS = 30_000;
export const LOCAL_PENDING_SLOW_INTERVAL = 10_000;
export const LOCAL_PENDING_MAX_AGE_MS = 5 * 60_000;
export const BACKEND_PENDING_SLOW_AFTER_MS = 5 * 60_000;
export const BACKEND_PENDING_SLOW_INTERVAL = 30_000;
export const BACKEND_PENDING_SLOWEST_AFTER_MS = 10 * 60_000;
export const BACKEND_PENDING_SLOWEST_INTERVAL = 60_000;

export type ActionsData = InfiniteData<WalletActionsResponse>;

export type Visibility = {
  isHidden: () => boolean;
  subscribe: (listener: () => void) => () => void;
};

export type LocalPending = {
  /** The local rows History shows in Pending against this loaded data. */
  getActions: (data: ActionsData) => { timestamp: number }[];
};

export const documentVisibility: Visibility = {
  isHidden: () => document.visibilityState !== 'visible',
  subscribe: (listener) => {
    document.addEventListener('visibilitychange', listener);
    return () => document.removeEventListener('visibilitychange', listener);
  },
};

export function canPollPending(params: WalletActionsPayload): boolean {
  return params.includePending === true && !params.cursor;
}

export function getPollPayload(
  params: WalletActionsPayload,
  since: number | undefined
): WalletActionsPayload {
  return { ...params, cursor: undefined, includePending: true, since };
}

export function hasPollablePending(data: ActionsData | undefined): boolean {
  return Boolean(data?.pages[0]?.pending.length);
}

function isMined(action: AddressAction) {
  return action.status === 'confirmed' || action.status === 'failed';
}

/** Null once no local row is in Pending or the newest one is older than the cap. */
export function getLocalPendingDelay(
  localPending: { timestamp: number }[],
  nowMs: number
): number | null {
  if (!localPending.length) {
    return null;
  }
  const ageMs =
    nowMs - Math.max(...localPending.map((action) => action.timestamp));
  if (ageMs >= LOCAL_PENDING_MAX_AGE_MS) {
    return null;
  }
  return ageMs < LOCAL_PENDING_FAST_WINDOW_MS
    ? PENDING_POLL_INTERVAL
    : LOCAL_PENDING_SLOW_INTERVAL;
}

const NO_LOCAL_PENDING: LocalPending = {
  getActions: () => [],
};

/** The episode starts when the backend pending list last went from empty to non-empty (WLT-3027). */
export function getBackendPendingDelay(episodeAgeMs: number): number {
  if (episodeAgeMs < BACKEND_PENDING_SLOW_AFTER_MS) {
    return PENDING_POLL_INTERVAL;
  }
  return episodeAgeMs < BACKEND_PENDING_SLOWEST_AFTER_MS
    ? BACKEND_PENDING_SLOW_INTERVAL
    : BACKEND_PENDING_SLOWEST_INTERVAL;
}

function getPollDelay(
  pendingSinceMs: number | undefined,
  localPending: { timestamp: number }[],
  nowMs: number
): number | null {
  const localDelay = getLocalPendingDelay(localPending, nowMs);
  if (pendingSinceMs === undefined) {
    return localDelay;
  }
  const backendDelay = getBackendPendingDelay(nowMs - pendingSinceMs);
  return localDelay === null
    ? backendDelay
    : Math.min(backendDelay, localDelay);
}

function trackPendingEpisode(
  pendingSinceMs: number | undefined,
  data: ActionsData | undefined,
  nowMs: number
): number | undefined {
  if (!hasPollablePending(data)) {
    return undefined;
  }
  return pendingSinceMs ?? nowMs;
}

function toSeconds(ms: number) {
  return Math.floor(ms / 1000);
}

function newestMinedMs(data: ActionsData): number | undefined {
  const minedMs = data.pages.flatMap((page) =>
    page.data.filter(isMined).map((action) => action.timestamp)
  );
  return minedMs.length ? Math.max(...minedMs) : undefined;
}

/** The backend filters the pending and unsigned lists by order creation time too, so `since` never passes a loaded pending row. */
export function getPollSince(data: ActionsData): number | undefined {
  const minedMs = newestMinedMs(data);
  const pendingMs = (data.pages[0]?.pending ?? []).map(
    (action) => action.timestamp
  );
  const bounds = minedMs === undefined ? pendingMs : [minedMs, ...pendingMs];
  return bounds.length ? toSeconds(Math.min(...bounds)) : undefined;
}

function mergeList(
  fresh: PendingAction[],
  cached: PendingAction[],
  since: number | undefined
): PendingAction[] {
  if (since === undefined) {
    return fresh;
  }
  const freshIds = new Set(fresh.map((action) => action.id));
  return [
    ...fresh,
    ...cached.filter(
      (action) =>
        toSeconds(action.timestamp) < since && !freshIds.has(action.id)
    ),
  ];
}

export function mergePendingPoll(
  data: ActionsData,
  response: WalletActionsResponse,
  since: number | undefined
): ActionsData {
  const [firstPage, ...laterPages] = data.pages;
  if (!firstPage) {
    return data;
  }
  const fresh = new Map(response.data.map((action) => [action.id, action]));
  const laterIds = new Set(
    laterPages.flatMap((page) => page.data.map((action) => action.id))
  );
  const firstPageIds = new Set(firstPage.data.map((action) => action.id));
  const added = response.data.filter(
    (action) => !firstPageIds.has(action.id) && !laterIds.has(action.id)
  );
  const lists = response.pendingListsAvailable
    ? {
        pending: mergeList(response.pending, firstPage.pending, since),
        unsigned: mergeList(response.unsigned, firstPage.unsigned, since),
        pendingListsAvailable: true,
      }
    : {};
  return {
    ...data,
    pages: [
      {
        ...firstPage,
        ...lists,
        data: [
          ...added,
          ...firstPage.data.map((action) => fresh.get(action.id) ?? action),
        ],
      },
      ...laterPages,
    ],
  };
}

/** False on a gap: more pages follow and no response row is at or before the newest loaded mined action. */
export function reachesLoadedHistory(
  data: ActionsData,
  response: WalletActionsResponse
): boolean {
  if (!response.meta?.pagination.cursor) {
    return true;
  }
  const boundaryMs = newestMinedMs(data);
  return (
    boundaryMs !== undefined &&
    response.data.some((action) => action.timestamp <= boundaryMs)
  );
}

async function applyPollResponse(
  queryClient: QueryClient,
  queryKey: QueryKey,
  data: ActionsData,
  response: WalletActionsResponse,
  since: number | undefined
) {
  if (reachesLoadedHistory(data, response)) {
    queryClient.setQueryData<ActionsData>(
      queryKey,
      mergePendingPoll(data, response, since)
    );
    return;
  }
  queryClient.setQueryData<ActionsData>(queryKey, {
    pages: data.pages.slice(0, 1),
    pageParams: data.pageParams.slice(0, 1),
  });
  await queryClient.refetchQueries({ queryKey, exact: true });
}

export function startPendingActionsPoll({
  queryClient,
  queryKey,
  fetchFirstPage,
  visibility,
  localPending = NO_LOCAL_PENDING,
}: {
  queryClient: QueryClient;
  queryKey: QueryKey;
  fetchFirstPage: (since: number | undefined) => Promise<WalletActionsResponse>;
  visibility: Visibility;
  localPending?: LocalPending;
}): () => void {
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let waitingForVisible = false;
  let pendingSinceMs = trackPendingEpisode(
    undefined,
    queryClient.getQueryData<ActionsData>(queryKey),
    Date.now()
  );

  async function tick() {
    if (stopped) {
      return;
    }
    if (visibility.isHidden()) {
      waitingForVisible = true;
      return;
    }
    const data = queryClient.getQueryData<ActionsData>(queryKey);
    if (!data) {
      return;
    }
    const nowMs = Date.now();
    pendingSinceMs = trackPendingEpisode(pendingSinceMs, data, nowMs);
    const delay = getPollDelay(
      pendingSinceMs,
      localPending.getActions(data),
      nowMs
    );
    if (delay === null) {
      return;
    }
    if (queryClient.isFetching({ queryKey, exact: true }) > 0) {
      timer = setTimeout(tick, PENDING_POLL_INTERVAL);
      return;
    }
    try {
      const since = getPollSince(data);
      const response = await fetchFirstPage(since);
      // a list refetch that landed meanwhile is fresher than this response
      const cacheUnchanged =
        queryClient.getQueryData<ActionsData>(queryKey) === data;
      if (!stopped && cacheUnchanged) {
        await applyPollResponse(queryClient, queryKey, data, response, since);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Pending actions poll failed', error);
    }
    if (!stopped) {
      timer = setTimeout(tick, delay);
    }
  }

  const unsubscribe = visibility.subscribe(() => {
    if (waitingForVisible && !visibility.isHidden()) {
      waitingForVisible = false;
      void tick();
    }
  });
  timer = setTimeout(tick, PENDING_POLL_INTERVAL);

  return () => {
    stopped = true;
    clearTimeout(timer);
    unsubscribe();
  };
}

const activePolls = new Map<string, { observers: number; stop: () => void }>();

/** One poll per query hash, however many components observe that query. */
export function acquirePendingActionsPoll(
  queryHash: string,
  start: () => () => void
): () => void {
  const active = activePolls.get(queryHash);
  if (active) {
    active.observers += 1;
  } else {
    activePolls.set(queryHash, { observers: 1, stop: start() });
  }
  return () => {
    const poll = activePolls.get(queryHash);
    if (!poll) {
      return;
    }
    poll.observers -= 1;
    if (poll.observers === 0) {
      poll.stop();
      activePolls.delete(queryHash);
    }
  };
}

import {
  InfiniteQueryObserver,
  QueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import type {
  AddressAction as Action,
  ActionStatus,
  PendingAction,
  PendingActionWire,
  Payload as WalletActionsPayload,
  Response as WalletActionsResponse,
} from 'src/modules/zerion-api/requests/wallet-get-actions';
import { normalizePendingList } from 'src/modules/zerion-api/requests/wallet-get-actions-pending.normalize';
import { getHistoryActionsParams } from 'src/ui/pages/History/getHistoryActionsParams';
import { filterPendingRows } from 'src/ui/pages/History/mergeHistoryActions';
import { getLocalPendingActions } from './getLocalPendingActions';
import {
  LOCAL_PENDING_MAX_AGE_MS,
  LOCAL_PENDING_SLOW_INTERVAL,
  PENDING_POLL_INTERVAL,
  acquirePendingActionsPoll,
  canPollPending,
  documentVisibility,
  getBackendPendingDelay,
  getLocalPendingDelay,
  getPollPayload,
  getPollSince,
  hasPollablePending,
  mergePendingPoll,
  reachesLoadedHistory,
  startPendingActionsPoll,
  type LocalPending,
  type Visibility,
} from './pendingActionsPoll';

// store-unit ships ESM only, which jest doesn't transform; its event API is not exercised here
jest.unstable_mockModule('store-unit', () => ({
  Store: class Store<T> {
    private state: T;
    constructor(state: T) {
      this.state = state;
    }
    getState() {
      return this.state;
    }
    setState(next: T) {
      this.state = next;
    }
  },
}));
const { hiddenPendingActionsStore, hidePendingAction } = await import(
  './hiddenPendingActions'
);

const ADDRESS = '0x42b9df65b219b3dd36ff330a4dd8f327a6ada990';
// 2026-10-16T12:00:00Z
const NEWEST_MINED_S = 1792152000;

const PARAMS: WalletActionsPayload = getHistoryActionsParams({
  address: ADDRESS,
  currency: 'usd',
  actionTypes: ['trade'],
  chain: 'base',
  isOwnWallet: true,
});
const QUERY_KEY = ['walletGetActions', PARAMS, 'no-permits'];

function action(
  id: string,
  timestampS: number,
  status: ActionStatus = 'confirmed'
): Action {
  return {
    address: ADDRESS,
    id,
    timestamp: timestampS * 1000,
    status,
    type: { value: 'trade', displayValue: 'Trade' },
    label: null,
    fee: null,
    refund: null,
    transaction: null,
    acts: [],
    content: null,
  };
}

function pendingRowsAt(
  list: 'pending' | 'unsigned',
  createdAtS: number,
  ...ids: string[]
) {
  const wire = ids.map(
    (id): PendingActionWire => ({
      address: ADDRESS,
      id,
      timestamp: createdAtS,
      type: { value: 'trade', displayValue: 'Trade' },
      label: null,
      fee: null,
      refund: null,
      transaction: null,
      content: { transfers: null, approvals: null },
      acts: [
        {
          type: { value: 'trade', displayValue: 'Trade' },
          label: null,
          content: { transfers: null, approvals: null },
          rate: null,
          transaction: {
            chain: { id: 'base', name: 'Base', iconUrl: null },
            hash: '',
            explorerUrl: null,
          },
        },
      ],
    })
  );
  return normalizePendingList(wire, list);
}

// Wire row shape per zpi-ref main PendingAction.yaml, as in ActivityTabMarker.test.tsx.
function pendingRows(list: 'pending' | 'unsigned', ...ids: string[]) {
  return pendingRowsAt(list, NEWEST_MINED_S + 30, ...ids);
}

function page(
  data: Action[],
  {
    pending = [],
    unsigned = [],
    cursor = '',
    pendingListsAvailable = true,
  }: Partial<
    Pick<
      WalletActionsResponse,
      'pending' | 'unsigned' | 'pendingListsAvailable'
    >
  > & { cursor?: string } = {}
): WalletActionsResponse {
  return {
    data,
    pending,
    unsigned,
    pendingListsAvailable,
    meta: { pagination: { cursor } },
  };
}

function cache(...pages: WalletActionsResponse[]) {
  return {
    pages,
    pageParams: pages.map((_, index) =>
      index === 0 ? undefined : `cursor-${index}`
    ),
  } as InfiniteData<WalletActionsResponse>;
}

const LOADED = cache(
  page(
    [
      action('mined-newest', NEWEST_MINED_S),
      action('mined-older', NEWEST_MINED_S - 60, 'failed'),
    ],
    {
      pending: pendingRows('pending', 'order-1'),
      unsigned: pendingRows('unsigned', 'sign-1'),
      cursor: 'cursor-1',
    }
  ),
  page([action('page-2-a', NEWEST_MINED_S - 3600)], { cursor: 'cursor-2' })
);

function fakeVisibility(hidden = false) {
  const listeners = new Set<() => void>();
  const visibility: Visibility = {
    isHidden: () => hidden,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
  return {
    visibility,
    setHidden(next: boolean) {
      hidden = next;
      listeners.forEach((listener) => listener());
    },
  };
}

function setup({
  data = LOADED as InfiniteData<WalletActionsResponse> | null,
  responses = [] as (WalletActionsResponse | Error)[],
  hidden = false,
} = {}) {
  const queryClient = new QueryClient();
  if (data) {
    queryClient.setQueryData(QUERY_KEY, data);
  }
  const requests: WalletActionsPayload[] = [];
  const api = jest.fn(async (payload: WalletActionsPayload) => {
    requests.push(payload);
    const next = responses.shift() ?? page([], { pending: [] });
    if (next instanceof Error) {
      throw next;
    }
    return next;
  });
  const { visibility, setHidden } = fakeVisibility(hidden);
  const stop = startPendingActionsPoll({
    queryClient,
    queryKey: QUERY_KEY,
    fetchFirstPage: (since) => api(getPollPayload(PARAMS, since)),
    visibility,
  });
  const read = () =>
    queryClient.getQueryData<InfiniteData<WalletActionsResponse>>(QUERY_KEY);
  return { queryClient, requests, api, setHidden, stop, read };
}

const STILL_PENDING = page([], {
  pending: pendingRows('pending', 'order-1'),
});

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('pending actions poll: when it runs (AC1)', () => {
  it('with a pending row, sends one first-page request every 3 s carrying since, includePending and the list filters', async () => {
    const { requests, stop } = setup({
      responses: [STILL_PENDING, STILL_PENDING, STILL_PENDING],
    });

    await jest.advanceTimersByTimeAsync(PENDING_POLL_INTERVAL - 1);
    expect(requests).toHaveLength(0);
    await jest.advanceTimersByTimeAsync(1);
    expect(requests).toHaveLength(1);
    await jest.advanceTimersByTimeAsync(2 * PENDING_POLL_INTERVAL);
    expect(requests).toHaveLength(3);

    expect(requests[0]).toEqual({
      addresses: [ADDRESS],
      currency: 'usd',
      actionTypes: ['trade'],
      assetTypes: undefined,
      limit: 10,
      chain: 'base',
      searchQuery: undefined,
      cursor: undefined,
      includePending: true,
      since: NEWEST_MINED_S,
    });
    stop();
  });

  it('with only unsigned rows, sends nothing', async () => {
    const { requests, stop } = setup({
      data: cache(
        page([action('a', 1)], { unsigned: pendingRows('unsigned', 's') })
      ),
    });
    await jest.advanceTimersByTimeAsync(5 * PENDING_POLL_INTERVAL);
    expect(requests).toHaveLength(0);
    stop();
  });

  it('with no pending rows or nothing loaded, sends nothing', async () => {
    const empty = setup({ data: cache(page([action('a', 1)])) });
    const unloaded = setup({ data: null });
    await jest.advanceTimersByTimeAsync(5 * PENDING_POLL_INTERVAL);
    expect(empty.requests).toHaveLength(0);
    expect(unloaded.requests).toHaveLength(0);
    empty.stop();
    unloaded.stop();
  });

  it('stops after the first response with an empty pending list', async () => {
    const { requests, stop } = setup({
      responses: [
        STILL_PENDING,
        page([action('order-1-mined', NEWEST_MINED_S + 40)]),
      ],
    });
    await jest.advanceTimersByTimeAsync(10 * PENDING_POLL_INTERVAL);
    expect(requests).toHaveLength(2);
    expect(requests[1].since).toBe(NEWEST_MINED_S);
    stop();
  });

  it('sends the next since from the merged cache: the newest mined action, or an older pending row', async () => {
    const { requests, stop } = setup({
      responses: [
        page([action('mined-new', NEWEST_MINED_S + 125)], {
          pending: pendingRowsAt('pending', NEWEST_MINED_S + 100, 'order-2'),
        }),
        STILL_PENDING,
      ],
    });
    await jest.advanceTimersByTimeAsync(2 * PENDING_POLL_INTERVAL);
    expect(requests.map((request) => request.since)).toEqual([
      NEWEST_MINED_S,
      NEWEST_MINED_S + 100,
    ]);
    stop();
  });

  it('keeps a pending order created before the newest mined action across polls, given the backend filters the lists by since', async () => {
    const order = pendingRowsAt('pending', NEWEST_MINED_S - 300, 'old-order');
    const queryClient = new QueryClient();
    queryClient.setQueryData(
      QUERY_KEY,
      cache(page([action('mined-newest', NEWEST_MINED_S)], { pending: order }))
    );
    const requests: WalletActionsPayload[] = [];
    // public-api internal/transaction/pending.go Get → pending_history.go sideHistoryMatches: rows created before since are dropped.
    const backend = async (payload: WalletActionsPayload) => {
      requests.push(payload);
      const visible = (rows: typeof order) =>
        rows.filter(
          (row) =>
            payload.since === undefined ||
            Math.floor(row.timestamp / 1000) >= payload.since
        );
      return page([], { pending: visible(order) });
    };
    const stop = startPendingActionsPoll({
      queryClient,
      queryKey: QUERY_KEY,
      fetchFirstPage: (since) => backend(getPollPayload(PARAMS, since)),
      visibility: fakeVisibility().visibility,
    });
    await jest.advanceTimersByTimeAsync(3 * PENDING_POLL_INTERVAL);
    expect(requests.map((request) => request.since)).toEqual([
      NEWEST_MINED_S - 300,
      NEWEST_MINED_S - 300,
      NEWEST_MINED_S - 300,
    ]);
    const data =
      queryClient.getQueryData<InfiniteData<WalletActionsResponse>>(QUERY_KEY);
    expect(data?.pages[0].pending.map((row) => row.id)).toEqual(['old-order']);
    stop();
  });

  it('skips its tick while the list query itself is fetching', async () => {
    const { queryClient, requests, stop } = setup({
      responses: [STILL_PENDING],
    });
    void queryClient.fetchInfiniteQuery({
      queryKey: QUERY_KEY,
      queryFn: () => new Promise<WalletActionsResponse>(() => {}),
    });
    await jest.advanceTimersByTimeAsync(3 * PENDING_POLL_INTERVAL);
    expect(requests).toHaveLength(0);
    stop();
  });

  it('pauses while the document is hidden and resumes on visibility', async () => {
    const { requests, setHidden, stop } = setup({
      responses: [STILL_PENDING, STILL_PENDING, STILL_PENDING],
      hidden: true,
    });
    await jest.advanceTimersByTimeAsync(10 * PENDING_POLL_INTERVAL);
    expect(requests).toHaveLength(0);

    setHidden(false);
    await jest.advanceTimersByTimeAsync(0);
    expect(requests).toHaveLength(1);
    await jest.advanceTimersByTimeAsync(PENDING_POLL_INTERVAL);
    expect(requests).toHaveLength(2);

    setHidden(true);
    await jest.advanceTimersByTimeAsync(10 * PENDING_POLL_INTERVAL);
    expect(requests).toHaveLength(2);
    stop();
  });

  it('sends nothing after stop', async () => {
    const { requests, stop } = setup({ responses: [STILL_PENDING] });
    stop();
    await jest.advanceTimersByTimeAsync(5 * PENDING_POLL_INTERVAL);
    expect(requests).toHaveLength(0);
  });

  it('runs one poll per query however many observers acquire it', () => {
    const start = jest.fn(() => jest.fn());
    const releaseA = acquirePendingActionsPoll('hash', start);
    const releaseB = acquirePendingActionsPoll('hash', start);
    expect(start).toHaveBeenCalledTimes(1);
    const stop = start.mock.results[0].value;
    releaseA();
    expect(stop).not.toHaveBeenCalled();
    releaseB();
    expect(stop).toHaveBeenCalledTimes(1);
    acquirePendingActionsPoll('hash', start)();
    expect(start).toHaveBeenCalledTimes(2);
  });

  it('polls only first-page requests that ask for the pending lists', () => {
    expect(canPollPending(PARAMS)).toBe(true);
    expect(canPollPending({ ...PARAMS, includePending: undefined })).toBe(
      false
    );
    expect(canPollPending({ ...PARAMS, cursor: 'c' })).toBe(false);
  });
});

describe('documentVisibility', () => {
  it.each([
    ['visible', false],
    ['hidden', true],
  ])('with visibilityState %s, isHidden is %s', (visibilityState, hidden) => {
    const listeners = new Set<() => void>();
    Object.assign(globalThis, {
      document: {
        visibilityState,
        addEventListener: (_: string, listener: () => void) =>
          listeners.add(listener),
        removeEventListener: (_: string, listener: () => void) =>
          listeners.delete(listener),
      },
    });
    try {
      expect(documentVisibility.isHidden()).toBe(hidden);
      const unsubscribe = documentVisibility.subscribe(() => {});
      expect(listeners.size).toBe(1);
      unsubscribe();
      expect(listeners.size).toBe(0);
    } finally {
      Reflect.deleteProperty(globalThis, 'document');
    }
  });
});

describe('getPollSince', () => {
  it('is the newest confirmed or failed action time in seconds, ignoring indexer-pending rows', () => {
    expect(
      getPollSince(
        cache(
          page([
            action('indexer-pending', NEWEST_MINED_S + 500, 'pending'),
            action('failed', NEWEST_MINED_S - 10, 'failed'),
          ]),
          page([action('confirmed', NEWEST_MINED_S - 20)])
        )
      )
    ).toBe(NEWEST_MINED_S - 10);
  });

  it('is undefined when nothing mined or pending is loaded', () => {
    expect(getPollSince(cache(page([])))).toBeUndefined();
  });

  it('drops to the creation time of a pending row older than the newest mined action, ignoring fake rows', () => {
    expect(
      getPollSince(
        cache(
          page([action('mined', NEWEST_MINED_S)], {
            pending: [
              ...pendingRowsAt('pending', NEWEST_MINED_S - 45, 'older'),
              ...pendingRowsAt('pending', NEWEST_MINED_S + 45, 'newer'),
            ],
          })
        )
      )
    ).toBe(NEWEST_MINED_S - 45);
  });

  it('is the oldest pending row creation time when nothing mined is loaded', () => {
    expect(
      getPollSince(
        cache(
          page([], {
            pending: pendingRowsAt('pending', NEWEST_MINED_S, 'first-tx'),
          })
        )
      )
    ).toBe(NEWEST_MINED_S);
  });
});

describe('mergePendingPoll (AC2)', () => {
  it('prepends new mined actions without duplicating the inclusive since boundary, replaces the lists and keeps later pages', () => {
    const response = page(
      [
        action('mined-brand-new', NEWEST_MINED_S + 90),
        action('order-1', NEWEST_MINED_S + 60),
        action('mined-newest', NEWEST_MINED_S),
      ],
      { pending: [], unsigned: pendingRows('unsigned', 'sign-2') }
    );

    const merged = mergePendingPoll(LOADED, response, NEWEST_MINED_S);

    expect(merged.pages[0].data.map((item) => item.id)).toEqual([
      'mined-brand-new',
      'order-1',
      'mined-newest',
      'mined-older',
    ]);
    expect(merged.pages[0].pending).toEqual([]);
    expect(merged.pages[0].unsigned.map((item) => item.id)).toEqual(['sign-2']);
    expect(merged.pages[0].meta).toEqual({
      pagination: { cursor: 'cursor-1' },
    });
    expect(merged.pages[1]).toBe(LOADED.pages[1]);
    expect(merged.pageParams).toBe(LOADED.pageParams);
  });

  it('moves a pending row into history in the same update', () => {
    const merged = mergePendingPoll(
      LOADED,
      page([action('order-1', NEWEST_MINED_S + 60)], { pending: [] }),
      NEWEST_MINED_S
    );
    expect(merged.pages[0].pending).toEqual([]);
    expect(merged.pages[0].data[0]).toMatchObject({
      id: 'order-1',
      status: 'confirmed',
    });
    expect(hasPollablePending(merged)).toBe(false);
  });

  it('updates a first-page row returned again in place and leaves later-page duplicates alone', () => {
    const data = cache(
      page([
        action('indexer-row', NEWEST_MINED_S + 30, 'pending'),
        action('mined-newest', NEWEST_MINED_S),
      ]),
      page([action('page-2-a', NEWEST_MINED_S - 3600)])
    );
    const merged = mergePendingPoll(
      data,
      page([
        action('indexer-row', NEWEST_MINED_S + 30, 'confirmed'),
        action('page-2-a', NEWEST_MINED_S - 3600, 'failed'),
      ]),
      NEWEST_MINED_S
    );
    expect(merged.pages[0].data.map((item) => [item.id, item.status])).toEqual([
      ['indexer-row', 'confirmed'],
      ['mined-newest', 'confirmed'],
    ]);
    expect(merged.pages[1]).toBe(data.pages[1]);
  });

  it('keeps the cached lists when the response could not load them', () => {
    const merged = mergePendingPoll(
      LOADED,
      page([], { pendingListsAvailable: false }),
      NEWEST_MINED_S
    );
    expect(merged.pages[0].pending).toBe(LOADED.pages[0].pending);
    expect(merged.pages[0].unsigned).toBe(LOADED.pages[0].unsigned);
    expect(merged.pages[0].pendingListsAvailable).toBe(true);
  });

  it('keeps cached rows created before since, which the response cannot contain, and lets the response own the rest', () => {
    const data = cache(
      page([action('mined-newest', NEWEST_MINED_S)], {
        pending: pendingRowsAt('pending', NEWEST_MINED_S + 5, 'settled'),
        unsigned: [
          ...pendingRowsAt('unsigned', NEWEST_MINED_S - 86400, 'old-sign'),
          ...pendingRowsAt('unsigned', NEWEST_MINED_S - 1, 'edge-sign'),
          ...pendingRowsAt('unsigned', NEWEST_MINED_S, 'window-sign'),
        ],
      })
    );
    const merged = mergePendingPoll(
      data,
      page([], {
        pending: [],
        unsigned: [
          ...pendingRowsAt('unsigned', NEWEST_MINED_S + 9, 'new-sign'),
          ...pendingRowsAt('unsigned', NEWEST_MINED_S - 1, 'edge-sign'),
        ],
      }),
      NEWEST_MINED_S
    );
    expect(merged.pages[0].pending).toEqual([]);
    expect(merged.pages[0].unsigned.map((row) => row.id)).toEqual([
      'new-sign',
      'edge-sign',
      'old-sign',
    ]);
  });
});

describe('pending actions poll: cache effects', () => {
  it('writes the merged first page into the cache the list and badge read (AC2)', async () => {
    const { read, stop } = setup({
      responses: [
        page([action('order-1', NEWEST_MINED_S + 60)], {
          pending: [],
          unsigned: [],
        }),
      ],
    });
    await jest.advanceTimersByTimeAsync(PENDING_POLL_INTERVAL);
    const data = read();
    expect(data?.pages[0].data.map((item) => item.id)).toEqual([
      'order-1',
      'mined-newest',
      'mined-older',
    ]);
    expect(data?.pages[0].pending).toEqual([]);
    expect(data?.pages[0].unsigned).toEqual([]);
    expect(data?.pages[1]).toBe(LOADED.pages[1]);
    stop();
  });

  it('does not run the infinite query function (AC3)', async () => {
    const queryClient = new QueryClient();
    const queryFn = jest.fn(async ({ pageParam }: { pageParam?: string }) =>
      pageParam ? LOADED.pages[1] : LOADED.pages[0]
    );
    const observer = new InfiniteQueryObserver(queryClient, {
      queryKey: QUERY_KEY,
      queryFn,
      getNextPageParam: (lastPage) =>
        lastPage.meta?.pagination.cursor || undefined,
    });
    const unsubscribe = observer.subscribe(() => {});
    await jest.advanceTimersByTimeAsync(0);
    await observer.fetchNextPage();
    expect(queryFn).toHaveBeenCalledTimes(2);

    const api = jest.fn(async () => STILL_PENDING);
    const stop = startPendingActionsPoll({
      queryClient,
      queryKey: QUERY_KEY,
      fetchFirstPage: api,
      visibility: fakeVisibility().visibility,
    });
    await jest.advanceTimersByTimeAsync(3 * PENDING_POLL_INTERVAL);

    expect(api).toHaveBeenCalledTimes(3);
    expect(queryFn).toHaveBeenCalledTimes(2);
    expect(observer.getCurrentResult().data?.pages).toHaveLength(2);
    stop();
    unsubscribe();
  });
});

describe('pending actions poll: failures (AC4)', () => {
  it('on another error, keeps the cache and skips to the next tick', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { requests, read, stop } = setup({
      responses: [new Error('500'), STILL_PENDING],
    });
    await jest.advanceTimersByTimeAsync(PENDING_POLL_INTERVAL);
    expect(read()).toBe(LOADED);
    await jest.advanceTimersByTimeAsync(PENDING_POLL_INTERVAL);
    expect(requests).toHaveLength(2);
    stop();
  });
});

const DAY_S = 86400;
const ORDER = pendingRows('pending', 'order-1');
const OLD_UNSIGNED = pendingRowsAt(
  'unsigned',
  NEWEST_MINED_S - DAY_S,
  'old-sign'
);
const WITH_OLD_UNSIGNED = cache(
  page([action('mined-newest', NEWEST_MINED_S)], {
    pending: ORDER,
    unsigned: OLD_UNSIGNED,
  })
);

function listQuery(firstPages: WalletActionsResponse[]) {
  const queryClient = new QueryClient();
  const queryFn = jest.fn(async ({ pageParam }: { pageParam?: string }) =>
    pageParam ? LOADED.pages[1] : firstPages.shift() ?? LOADED.pages[0]
  );
  const observer = new InfiniteQueryObserver(queryClient, {
    queryKey: QUERY_KEY,
    queryFn,
    getNextPageParam: (lastPage) =>
      lastPage.meta?.pagination.cursor || undefined,
  });
  const unsubscribe = observer.subscribe(() => {});
  return { queryClient, queryFn, observer, unsubscribe };
}

// public-api internal/transaction/pending.go pendingProvider.Get → pending_history.go sideHistoryMatches: list rows created before since are dropped.
function startWithFilteringBackend(
  queryClient: QueryClient,
  lists: Pick<WalletActionsResponse, 'pending' | 'unsigned'>
) {
  const requests: WalletActionsPayload[] = [];
  const inWindow = (since: number | undefined) => (row: PendingAction) =>
    since === undefined || Math.floor(row.timestamp / 1000) >= since;
  const stop = startPendingActionsPoll({
    queryClient,
    queryKey: QUERY_KEY,
    fetchFirstPage: async (since) => {
      requests.push(getPollPayload(PARAMS, since));
      return page([], {
        pending: lists.pending.filter(inWindow(since)),
        unsigned: lists.unsigned.filter(inWindow(since)),
      });
    },
    visibility: fakeVisibility().visibility,
  });
  const read = () =>
    queryClient.getQueryData<InfiniteData<WalletActionsResponse>>(QUERY_KEY);
  return { requests, stop, read };
}

describe('pending actions poll: a response with a next cursor', () => {
  it('is not merged; the list reloads only its first page once instead', async () => {
    const { queryClient, queryFn, observer, unsubscribe } = listQuery([]);
    await jest.advanceTimersByTimeAsync(0);
    await observer.fetchNextPage();
    queryFn.mockClear();

    const stop = startPendingActionsPoll({
      queryClient,
      queryKey: QUERY_KEY,
      fetchFirstPage: async () =>
        page([action('burst', NEWEST_MINED_S + 200)], {
          pending: ORDER,
          cursor: 'more',
        }),
      visibility: fakeVisibility().visibility,
    });
    await jest.advanceTimersByTimeAsync(PENDING_POLL_INTERVAL);

    expect(queryFn).toHaveBeenCalledTimes(1);
    expect(queryFn.mock.calls[0][0].pageParam).toBeUndefined();
    expect(observer.getCurrentResult().data?.pages).toEqual([LOADED.pages[0]]);
    stop();
    unsubscribe();
  });
});

describe('pending actions poll: rows created before since', () => {
  it('an old pending row the response no longer lists is removed and the poll stops: no pending row is outside the window', async () => {
    const queryClient = new QueryClient();
    const oldOrder = pendingRowsAt(
      'pending',
      NEWEST_MINED_S - 300,
      'old-order'
    );
    queryClient.setQueryData(
      QUERY_KEY,
      cache(
        page([action('mined-newest', NEWEST_MINED_S)], { pending: oldOrder })
      )
    );
    const { requests, stop, read } = startWithFilteringBackend(queryClient, {
      pending: [],
      unsigned: [],
    });
    await jest.advanceTimersByTimeAsync(5 * PENDING_POLL_INTERVAL);
    expect(requests.map((request) => request.since)).toEqual([
      NEWEST_MINED_S - 300,
    ]);
    expect(read()?.pages[0].pending).toEqual([]);
    stop();
  });

  it('a kept old unsigned row that was cancelled is replaced by the next full refetch', async () => {
    const { queryClient, observer, unsubscribe } = listQuery([
      WITH_OLD_UNSIGNED.pages[0],
      page([action('mined-newest', NEWEST_MINED_S)], {
        pending: ORDER,
        unsigned: [],
      }),
    ]);
    await jest.advanceTimersByTimeAsync(0);
    const { stop, read } = startWithFilteringBackend(queryClient, {
      pending: ORDER,
      unsigned: [],
    });
    await jest.advanceTimersByTimeAsync(PENDING_POLL_INTERVAL);
    expect(read()?.pages[0].unsigned.map((row) => row.id)).toEqual([
      'old-sign',
    ]);

    await observer.refetch();
    expect(read()?.pages[0].unsigned).toEqual([]);
    stop();
    unsubscribe();
  });

  it('a kept old unsigned row that is dismissed is hidden at once', async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(QUERY_KEY, WITH_OLD_UNSIGNED);
    const { stop, read } = startWithFilteringBackend(queryClient, {
      pending: ORDER,
      unsigned: [],
    });
    await jest.advanceTimersByTimeAsync(PENDING_POLL_INTERVAL);
    const kept = read()?.pages[0].unsigned ?? [];
    expect(kept.map((row) => row.id)).toEqual(['old-sign']);

    hidePendingAction('old-sign');
    expect(
      filterPendingRows(kept, {}, hiddenPendingActionsStore.getState())
    ).toEqual([]);
    hiddenPendingActionsStore.setState(new Set());
    stop();
  });
});

describe('pending actions poll: next cursor that overlaps the loaded history', () => {
  it('is merged without touching the list query, since the page reaches the newest loaded mined action', async () => {
    const { queryClient, queryFn, observer, unsubscribe } = listQuery([]);
    await jest.advanceTimersByTimeAsync(0);
    await observer.fetchNextPage();
    queryFn.mockClear();
    const overlapping = page(
      [
        action('new', NEWEST_MINED_S + 9),
        action('mined-newest', NEWEST_MINED_S),
      ],
      { pending: ORDER, cursor: 'more' }
    );
    expect(reachesLoadedHistory(LOADED, overlapping)).toBe(true);

    const stop = startPendingActionsPoll({
      queryClient,
      queryKey: QUERY_KEY,
      fetchFirstPage: async () => overlapping,
      visibility: fakeVisibility().visibility,
    });
    await jest.advanceTimersByTimeAsync(3 * PENDING_POLL_INTERVAL);

    expect(queryFn).not.toHaveBeenCalled();
    const pages = observer.getCurrentResult().data?.pages;
    expect(pages?.[0].data.map((item) => item.id)).toEqual([
      'new',
      'mined-newest',
      'mined-older',
    ]);
    expect(pages?.[0].meta).toEqual({ pagination: { cursor: 'cursor-1' } });
    expect(pages?.[1]).toBe(LOADED.pages[1]);
    stop();
    unsubscribe();
  });
});

it('discards a poll response when a list refetch landed while it was in flight', async () => {
  const queryClient = new QueryClient();
  queryClient.setQueryData(QUERY_KEY, LOADED);
  const stop = startPendingActionsPoll({
    queryClient,
    queryKey: QUERY_KEY,
    fetchFirstPage: async () => {
      queryClient.setQueryData(QUERY_KEY, WITH_OLD_UNSIGNED);
      return page([action('poll-only', NEWEST_MINED_S + 5)], { pending: [] });
    },
    visibility: fakeVisibility().visibility,
  });
  await jest.advanceTimersByTimeAsync(PENDING_POLL_INTERVAL);
  expect(queryClient.getQueryData(QUERY_KEY)).toStrictEqual(WITH_OLD_UNSIGNED);
  stop();
});

describe('getPollSince: the window holds every real pending row', () => {
  it('for 500 generated caches, no real pending row is outside the window and since never passes the newest mined action', () => {
    let seed = 7;
    const random = (max: number) => {
      seed = (seed * 1103515245 + 12345) % 2 ** 31;
      return seed % max;
    };
    for (let run = 0; run < 500; run++) {
      const mined = Array.from({ length: random(4) }, (_, i) =>
        action(`m-${i}`, NEWEST_MINED_S - random(10 * DAY_S))
      );
      const rows = (list: 'pending' | 'unsigned') =>
        Array.from({ length: random(4) }, (_, i) =>
          pendingRowsAt(
            list,
            NEWEST_MINED_S + 600 - random(30 * DAY_S),
            `${list}-${i}`
          )
        ).flat();
      const pending = rows('pending');
      const since = getPollSince(
        cache(page(mined, { pending, unsigned: rows('unsigned') }))
      );
      if (!mined.length && !pending.length) {
        expect(since).toBeUndefined();
        continue;
      }
      for (const row of pending) {
        expect(Math.floor(row.timestamp / 1000)).toBeGreaterThanOrEqual(
          since as number
        );
      }
      if (mined.length) {
        expect(since).toBeLessThanOrEqual(
          Math.max(...mined.map((item) => item.timestamp / 1000))
        );
      }
    }
  });

  it('ignores an old unsigned row: one day-old unsigned row and a fresh pending row give since at the pending row', () => {
    const fresh = pendingRowsAt('pending', NEWEST_MINED_S - 60, 'fresh-order');
    expect(
      getPollSince(
        cache(
          page([action('mined-newest', NEWEST_MINED_S)], {
            pending: fresh,
            unsigned: OLD_UNSIGNED,
          })
        )
      )
    ).toBe(NEWEST_MINED_S - 60);
  });
});

describe('reachesLoadedHistory: refetch only on a proven gap', () => {
  const withCursor = (data: Action[]) => page(data, { cursor: 'more' });

  it.each(
    (
      [
        ['no next cursor', page([action('new', NEWEST_MINED_S + 900)]), true],
        [
          'a next cursor and a row at the newest loaded mined action',
          withCursor([action('mined-newest', NEWEST_MINED_S)]),
          true,
        ],
        [
          'a next cursor and an unloaded row in the same second as the newest loaded mined action',
          withCursor([action('same-second', NEWEST_MINED_S)]),
          true,
        ],
        [
          'a next cursor and only an already loaded id at a newer time',
          withCursor([action('mined-older', NEWEST_MINED_S + 900)]),
          false,
        ],
        [
          'a next cursor and every row newer than the loaded history',
          withCursor([action('new', NEWEST_MINED_S + 900)]),
          false,
        ],
      ] as [string, WalletActionsResponse, boolean][]
    ).map(
      ([name, response, expected]): [
        string,
        WalletActionsResponse,
        boolean
      ] => [`${name}, returns ${expected}`, response, expected]
    )
  )('with %s', (_, response, expected) => {
    expect(reachesLoadedHistory(LOADED, response)).toBe(expected);
  });

  it('with nothing mined loaded, a next cursor without an already loaded id is a gap', () => {
    expect(
      reachesLoadedHistory(
        cache(page([], { pending: ORDER })),
        withCursor([action('new', NEWEST_MINED_S)])
      )
    ).toBe(false);
  });

  it('after one gap refetch, the next overlapping tick merges again without another refetch', async () => {
    const { queryClient, queryFn, observer, unsubscribe } = listQuery([]);
    await jest.advanceTimersByTimeAsync(0);
    await observer.fetchNextPage();
    queryFn.mockClear();
    const responses = [
      withCursor([action('burst', NEWEST_MINED_S + 900)]),
      withCursor([
        action('next', NEWEST_MINED_S + 30),
        action('mined-newest', NEWEST_MINED_S),
      ]),
      withCursor([
        action('next', NEWEST_MINED_S + 30),
        action('mined-newest', NEWEST_MINED_S),
      ]),
    ].map((response) => ({ ...response, pending: ORDER }));
    const stop = startPendingActionsPoll({
      queryClient,
      queryKey: QUERY_KEY,
      fetchFirstPage: async () => responses.shift() ?? STILL_PENDING,
      visibility: fakeVisibility().visibility,
    });

    await jest.advanceTimersByTimeAsync(PENDING_POLL_INTERVAL);
    expect(queryFn).toHaveBeenCalledTimes(1);
    await jest.advanceTimersByTimeAsync(2 * PENDING_POLL_INTERVAL);
    expect(queryFn).toHaveBeenCalledTimes(1);
    expect(
      observer.getCurrentResult().data?.pages[0].data.map((item) => item.id)
    ).toEqual(['next', 'mined-newest', 'mined-older']);
    stop();
    unsubscribe();
  });
});

describe('pending actions poll: reviewer probes', () => {
  it('a persistent overlapping next cursor (old pending order, > limit mined rows in the window) merges without refetching or trimming pages', async () => {
    const LIMIT = 10;
    const order = pendingRowsAt('pending', NEWEST_MINED_S - 3600, 'stuck');
    const mined = Array.from({ length: 15 }, (_, i) =>
      action(`m-${i}`, NEWEST_MINED_S - i * 60)
    );
    const backendPage = (since: number | undefined) => {
      const rows = mined.filter(
        (a) => since === undefined || a.timestamp / 1000 >= since
      );
      return page(rows.slice(0, LIMIT), {
        pending: order,
        cursor: rows.length > LIMIT ? 'more' : '',
      });
    };
    const queryClient = new QueryClient();
    const queryFn = jest.fn(async ({ pageParam }: { pageParam?: string }) =>
      pageParam ? page(mined.slice(LIMIT), {}) : backendPage(undefined)
    );
    const observer = new InfiniteQueryObserver(queryClient, {
      queryKey: QUERY_KEY,
      queryFn,
      getNextPageParam: (lastPage) =>
        lastPage.meta?.pagination.cursor || undefined,
    });
    const unsubscribe = observer.subscribe(() => {});
    await jest.advanceTimersByTimeAsync(0);
    await observer.fetchNextPage();
    queryFn.mockClear();
    const polls: (number | undefined)[] = [];
    const stop = startPendingActionsPoll({
      queryClient,
      queryKey: QUERY_KEY,
      fetchFirstPage: async (since) => {
        polls.push(since);
        return backendPage(since);
      },
      visibility: fakeVisibility().visibility,
    });
    await jest.advanceTimersByTimeAsync(4 * PENDING_POLL_INTERVAL);
    expect(polls).toHaveLength(4);
    expect(queryFn).not.toHaveBeenCalled();
    expect(observer.getCurrentResult().data?.pages).toHaveLength(2);
    stop();
    unsubscribe();
  });

  it('a loaded indexer-pending row confirmed far above the loaded history does not count as overlap: the gap is refetched, not merged', async () => {
    const loaded = page(
      [
        action('tx-x', NEWEST_MINED_S + 10, 'pending'),
        action('mined-newest', NEWEST_MINED_S),
      ],
      { pending: ORDER }
    );
    const { queryClient, queryFn, observer, unsubscribe } = listQuery([
      loaded,
      loaded,
    ]);
    await jest.advanceTimersByTimeAsync(0);
    queryFn.mockClear();
    const response = page(
      [
        ...Array.from({ length: 9 }, (_, i) =>
          action(`late-${i}`, NEWEST_MINED_S + 7200 - i * 60)
        ),
        action('tx-x', NEWEST_MINED_S + 6000),
      ],
      { pending: ORDER, cursor: 'more' }
    );
    const stop = startPendingActionsPoll({
      queryClient,
      queryKey: QUERY_KEY,
      fetchFirstPage: async () => response,
      visibility: fakeVisibility().visibility,
    });
    await jest.advanceTimersByTimeAsync(PENDING_POLL_INTERVAL);
    expect(queryFn).toHaveBeenCalledTimes(1);
    expect(
      observer.getCurrentResult().data?.pages[0].data.map((item) => item.id)
    ).toEqual(['tx-x', 'mined-newest']);
    stop();
    unsubscribe();
  });
});

// WLT-3016: the Zama Claim signed from History at 14:09:04Z on 2026-10-20.
const CLAIM_HASH =
  '0x37b77cd8656ce388f58785f5dc69ecbbd98a137fd5556a8be932d3494371411e';
const CLAIM_SIGNED_MS = Date.parse('2026-10-20T14:09:04Z');
// A device clock 10 s ahead stamps the local row after the mined time, so only the hash match can clear it.
const CLAIM_MINED_S = Date.parse('2026-10-20T14:09:11Z') / 1000 - 10;

function withHash(item: Action, hash: string): Action {
  return {
    ...item,
    acts: [
      {
        type: item.type,
        label: null,
        content: { transfers: null, approvals: null },
        rate: null,
        status: item.status,
        transaction: {
          chain: { id: 'base', name: 'Base', iconUrl: null },
          hash,
          explorerUrl: null,
        },
      },
    ],
  };
}

function localClaim(status: ActionStatus = 'pending'): Action {
  return {
    ...withHash(
      action(CLAIM_HASH, CLAIM_SIGNED_MS / 1000, status),
      `0x${CLAIM_HASH.slice(2).toUpperCase()}`
    ),
    id: CLAIM_HASH,
  };
}

function fakeLocalPending(initial: Action[]) {
  let localActions = initial;
  const localPending: LocalPending = {
    getActions: (data) =>
      getLocalPendingActions({
        localActions,
        actions: data.pages.flatMap((item) => item.data),
        pending: data.pages[0]?.pending ?? [],
        unsigned: data.pages[0]?.unsigned ?? [],
        contentFiltered: false,
      }),
  };
  return {
    localPending,
    set(next: Action[]) {
      localActions = next;
    },
  };
}

const NO_BACKEND_PENDING = cache(
  page([action('mined-newest', NEWEST_MINED_S)], { pending: [] })
);

function setupLocal({
  local = [localClaim()],
  ageMs,
  responses = [] as WalletActionsResponse[],
  hidden = false,
  data = NO_BACKEND_PENDING,
}: {
  local?: Action[];
  ageMs: number;
  responses?: WalletActionsResponse[];
  hidden?: boolean;
  data?: InfiniteData<WalletActionsResponse>;
}) {
  jest.setSystemTime(CLAIM_SIGNED_MS + ageMs);
  const queryClient = new QueryClient();
  queryClient.setQueryData(QUERY_KEY, data);
  const requests: WalletActionsPayload[] = [];
  const { localPending, set } = fakeLocalPending(local);
  const { visibility, setHidden } = fakeVisibility(hidden);
  const stop = startPendingActionsPoll({
    queryClient,
    queryKey: QUERY_KEY,
    fetchFirstPage: async (since) => {
      requests.push(getPollPayload(PARAMS, since));
      return responses.shift() ?? page([], { pending: [] });
    },
    visibility,
    localPending,
  });
  return { requests, stop, setLocal: set, setHidden };
}

const CLAIM_INDEXED = page(
  [withHash(action('claim-indexed', CLAIM_MINED_S), CLAIM_HASH)],
  { pending: [] }
);

describe('pending actions poll: a local row in Pending (WLT-3016 AC1)', () => {
  it('keeps sending incremental requests every 3 s until 30 s after signing, then every 10 s', async () => {
    const { requests, stop } = setupLocal({ ageMs: 10_000 });

    // ticks at ages 13, 16, 19, 22, 25, 28 and 31 s; the 31 s tick schedules 10 s
    await jest.advanceTimersByTimeAsync(21_000);
    expect(requests).toHaveLength(7);
    await jest.advanceTimersByTimeAsync(10_000 - 1);
    expect(requests).toHaveLength(7);
    await jest.advanceTimersByTimeAsync(1);
    expect(requests).toHaveLength(8);
    expect(requests.every((request) => request.since === NEWEST_MINED_S)).toBe(
      true
    );
    stop();
  });

  it('stops once the mined action with the local hash is loaded, compared case-insensitively', async () => {
    const { requests, stop } = setupLocal({
      ageMs: 10_000,
      responses: [page([], { pending: [] }), CLAIM_INDEXED],
    });
    await jest.advanceTimersByTimeAsync(2 * PENDING_POLL_INTERVAL);
    expect(requests).toHaveLength(2);
    await jest.advanceTimersByTimeAsync(LOCAL_PENDING_MAX_AGE_MS);
    expect(requests).toHaveLength(2);
    stop();
  });

  it('stops 5 min after the newest local row was added', async () => {
    const { requests, stop } = setupLocal({
      ageMs: LOCAL_PENDING_MAX_AGE_MS - 10_000,
    });
    // one tick at 4:53; the next would fall at 5:03, past the cap
    await jest.advanceTimersByTimeAsync(10 * 60_000);
    expect(requests).toHaveLength(1);
    stop();
  });

  it('sends nothing with no local row and no backend pending row (AC4)', async () => {
    const { requests, stop } = setupLocal({ local: [], ageMs: 10_000 });
    await jest.advanceTimersByTimeAsync(LOCAL_PENDING_MAX_AGE_MS);
    expect(requests).toHaveLength(0);
    stop();
  });

  it('sends nothing for a local row whose hash is already loaded', async () => {
    const { requests, stop } = setupLocal({
      ageMs: 10_000,
      data: cache(CLAIM_INDEXED),
    });
    await jest.advanceTimersByTimeAsync(LOCAL_PENDING_MAX_AGE_MS);
    expect(requests).toHaveLength(0);
    stop();
  });

  it('pauses while the document is hidden and resumes on visibility (AC4)', async () => {
    const { requests, setHidden, stop } = setupLocal({
      ageMs: 10_000,
      hidden: true,
    });
    await jest.advanceTimersByTimeAsync(20_000);
    expect(requests).toHaveLength(0);
    setHidden(false);
    await jest.advanceTimersByTimeAsync(0);
    expect(requests).toHaveLength(1);
    stop();
  });

  it('getLocalPendingDelay: 3 s under 30 s, 10 s under 5 min, null after or with no row', () => {
    const local = [localClaim()];
    expect(getLocalPendingDelay(local, CLAIM_SIGNED_MS + 29_999)).toBe(3000);
    expect(getLocalPendingDelay(local, CLAIM_SIGNED_MS + 30_000)).toBe(10_000);
    expect(getLocalPendingDelay(local, CLAIM_SIGNED_MS + 299_999)).toBe(10_000);
    expect(getLocalPendingDelay(local, CLAIM_SIGNED_MS + 300_000)).toBeNull();
    expect(getLocalPendingDelay([], CLAIM_SIGNED_MS)).toBeNull();
  });
});

describe('pending actions poll: a node status on the local row changes nothing (WLT-3023)', () => {
  it.each(['confirmed', 'failed'] as const)(
    'a %s local status keeps the 10 s schedule until the hash loads',
    async (status) => {
      const { requests, setLocal, stop } = setupLocal({
        ageMs: 40_000,
        responses: [page([], { pending: [] }), CLAIM_INDEXED],
      });
      setLocal([localClaim(status)]);
      await jest.advanceTimersByTimeAsync(PENDING_POLL_INTERVAL - 1);
      expect(requests).toHaveLength(0);

      await jest.advanceTimersByTimeAsync(1);
      expect(requests).toHaveLength(1);
      await jest.advanceTimersByTimeAsync(LOCAL_PENDING_SLOW_INTERVAL);
      expect(requests).toHaveLength(2);
      await jest.advanceTimersByTimeAsync(LOCAL_PENDING_MAX_AGE_MS);
      expect(requests).toHaveLength(2);
      stop();
    }
  );
});

describe('pending actions poll: backend pending slows over time (WLT-3027 AC1)', () => {
  const START_MS = CLAIM_SIGNED_MS - 660_000;

  function setupEpisode() {
    jest.setSystemTime(START_MS);
    const queryClient = new QueryClient();
    queryClient.setQueryData(QUERY_KEY, LOADED);
    const requestS: number[] = [];
    let backendPending = true;
    let local: Action[] = [];
    const stop = startPendingActionsPoll({
      queryClient,
      queryKey: QUERY_KEY,
      fetchFirstPage: async () => {
        requestS.push((Date.now() - START_MS) / 1000);
        return backendPending ? STILL_PENDING : page([], { pending: [] });
      },
      visibility: fakeVisibility().visibility,
      localPending: { getActions: () => local },
    });
    return {
      requestS,
      stop,
      setBackendPending(next: boolean) {
        backendPending = next;
      },
      setLocal(next: Action[]) {
        local = next;
      },
    };
  }

  it('polls every 3 s until 5 min, every 30 s until 10 min, then every 60 s', async () => {
    const { requestS, stop } = setupEpisode();
    await jest.advanceTimersByTimeAsync(720_000);
    expect(requestS.filter((s) => s >= 291 && s <= 360)).toEqual([
      291, 294, 297, 300, 330, 360,
    ]);
    expect(requestS.filter((s) => s >= 540)).toEqual([540, 570, 600, 660, 720]);
    expect(requestS).toHaveLength(112);
    stop();
  });

  it('keeps a 60 s cadence while pending items remain', async () => {
    const { requestS, stop } = setupEpisode();
    await jest.advanceTimersByTimeAsync(30 * 60_000);
    expect(requestS.filter((s) => s > 600)).toEqual(
      Array.from({ length: 20 }, (_, index) => 660 + 60 * index)
    );
    stop();
  });

  it('starts a new 3 s episode once pending empties and then reappears', async () => {
    const { requestS, setBackendPending, setLocal, stop } = setupEpisode();
    await jest.advanceTimersByTimeAsync(660_000);
    // a local row signed now keeps the poll alive at 10 s while backend pending is empty
    setLocal([localClaim()]);
    setBackendPending(false);
    await jest.advanceTimersByTimeAsync(95_000);
    setBackendPending(true);
    await jest.advanceTimersByTimeAsync(22_000);
    expect(requestS.filter((s) => s >= 660)).toEqual([
      660, 720, 730, 740, 750, 760, 770, 773, 776,
    ]);
    stop();
  });

  it('getBackendPendingDelay: 3 s under 5 min, 30 s under 10 min, 60 s after', () => {
    expect(getBackendPendingDelay(299_999)).toBe(3000);
    expect(getBackendPendingDelay(300_000)).toBe(30_000);
    expect(getBackendPendingDelay(599_999)).toBe(30_000);
    expect(getBackendPendingDelay(600_000)).toBe(60_000);
    expect(getBackendPendingDelay(3_600_000)).toBe(60_000);
  });
});

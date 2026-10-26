import {
  afterEach,
  beforeEach,
  describe,
  expect,
  jest,
  test,
} from '@jest/globals';
import { HTTPError } from 'ky';
import type {
  OrderActionWire,
  OrderFill,
  OrderStatus,
  Response as OrderStatusResponse,
} from 'src/modules/zerion-api/requests/transaction-get-order-status';
import {
  BRIDGE_DESTINATION_MINED,
  BRIDGE_DESTINATION_PENDING,
  BRIDGE_SOURCE_MINED,
  ZAMA_UNWRAP_MINED,
  zamaClaimUnsigned,
} from './orderActions.fixtures';
import type {
  FollowSubmittedOrderDeps,
  OrderExplorer,
  OrderOutcome,
} from './followSubmittedOrder';

jest.unstable_mockModule('src/modules/zerion-api/zerion-api.client', () => ({
  ZerionAPI: { transactionGetOrderStatus: jest.fn() },
}));

const {
  SUBMITTED_FOLLOW_UP_TIMEOUT_MS,
  decideSubmittedOrder,
  followSubmittedOrder,
  getDoneExplorerUrl,
  getFillExplorerUrl,
  submittedFollowUpIntervalMs,
} = await import('./followSubmittedOrder');
const { pollOrderStatus } = await import('./waitForOrderStatus');

const ORDER_ID = 'relay:order-1';
const SWAP_HASH = `0x${'ab'.repeat(32)}`;
const FILL: OrderFill = { chain: 'arbitrum', hash: `0x${'3e'.repeat(32)}` };
/** `orderActions.fixtures` links every mined act on etherscan */
const DESTINATION_URL = `https://etherscan.io/tx/0x${'b2d4f6a8'.repeat(8)}`;

const inputChainExplorer: OrderExplorer = {
  providerTemplate: null,
  inputChainTemplate: 'https://basescan.org/tx/{HASH}',
};
const relayExplorer: OrderExplorer = {
  providerTemplate: 'https://relay.link/transaction/{HASH}',
  inputChainTemplate: 'https://basescan.org/tx/{HASH}',
};

interface OrderReply {
  status: OrderStatus;
  fills?: OrderFill[];
  actions?: OrderActionWire[] | null;
}
type Reply = OrderReply | { error: unknown };

const BRIDGE_SOURCE_ONLY: OrderReply = {
  status: 'pending',
  actions: [BRIDGE_SOURCE_MINED, BRIDGE_DESTINATION_PENDING],
};
const BRIDGE_BOTH_MINED: OrderReply = {
  status: 'pending',
  actions: [BRIDGE_SOURCE_MINED, BRIDGE_DESTINATION_MINED],
};
const INTENT_FILL_PENDING: OrderReply = {
  status: 'pending',
  actions: [BRIDGE_DESTINATION_PENDING],
};
const INTENT_FILL_MINED: OrderReply = {
  status: 'pending',
  actions: [BRIDGE_DESTINATION_MINED],
};

const httpError = (status: number) =>
  new HTTPError(
    new Response('{"errors":[{"title":"order not found"}]}', { status }),
    new Request('https://x'),
    {} as never
  );

/** Follows the order against a get-order-status that replays `replies`, then repeats `rest` */
function follow({
  swapHash = null,
  replies,
  rest = BRIDGE_SOURCE_ONLY,
  depsOverride = {},
  explorer = inputChainExplorer,
}: {
  swapHash?: string | null;
  replies: Reply[];
  rest?: Reply;
  depsOverride?: Partial<FollowSubmittedOrderDeps>;
  explorer?: OrderExplorer;
}) {
  const queue = [...replies];
  const startedAt = Date.now();
  const requestTimesS: number[] = [];
  const getOrderStatus = jest.fn(
    async (_params: {
      orderId: string;
      currency: string;
    }): Promise<OrderStatusResponse> => {
      requestTimesS.push((Date.now() - startedAt) / 1000);
      const reply = queue.shift() ?? rest;
      if ('error' in reply) {
        throw reply.error;
      }
      return {
        data: {
          status: reply.status,
          fills: reply.fills ?? [],
          actions: reply.actions,
        },
      };
    }
  );
  const outcomes: OrderOutcome[] = [];
  const logError = jest.fn();
  const abort = new AbortController();
  const run = followSubmittedOrder(
    {
      orderId: ORDER_ID,
      swapHash,
      explorer,
      currency: 'eur',
      signal: abort.signal,
      onOutcome: (outcome) => outcomes.push(outcome),
    },
    {
      pollOrderStatus: (orderId, decide, options) =>
        pollOrderStatus(orderId, decide, { ...options, getOrderStatus }),
      logError,
      ...depsOverride,
    }
  );
  return { getOrderStatus, requestTimesS, outcomes, logError, abort, run };
}

/** `from`, `from + step` … `to`, inclusive */
const range = (from: number, to: number, step: number) =>
  Array.from({ length: (to - from) / step + 1 }, (_, i) => from + i * step);

beforeEach(() => {
  jest.useFakeTimers();
});
afterEach(() => {
  jest.useRealTimers();
});

describe('submittedFollowUpIntervalMs', () => {
  test.each([
    [0, 3000],
    [29_999, 3000],
    [30_000, 5000],
    [119_999, 5000],
    [120_000, 10_000],
    [299_999, 10_000],
    [300_000, 30_000],
  ])('at %i ms elapsed the next request waits %i ms', (elapsed, interval) => {
    expect(submittedFollowUpIntervalMs(elapsed)).toBe(interval);
  });
});

describe('decideSubmittedOrder — which response decides the outcome', () => {
  test.each<[string, OrderReply, string | null]>([
    ['a bridge with its destination pending', BRIDGE_SOURCE_ONLY, null],
    ['an intent fill still pending', INTENT_FILL_PENDING, null],
    [
      'a pending order with no actions loaded',
      { status: 'pending', actions: null },
      null,
    ],
    ['a pending order with actions absent', { status: 'pending' }, null],
    [
      'a pending order with no actions',
      { status: 'pending', actions: [] },
      null,
    ],
    ['a bridge with both legs mined', BRIDGE_BOTH_MINED, 'done'],
    ['an intent fill mined', INTENT_FILL_MINED, 'done'],
    [
      'the unwrap mined on its own',
      { status: 'pending', actions: [ZAMA_UNWRAP_MINED] },
      'done',
    ],
    [
      'successful with an action still pending',
      { ...BRIDGE_SOURCE_ONLY, status: 'successful' },
      'done',
    ],
    ['successful with no actions', { status: 'successful' }, 'done'],
    [
      'failed with every action mined',
      { ...BRIDGE_BOTH_MINED, status: 'failed' },
      'failed',
    ],
    ['rejected', { status: 'rejected' }, 'failed'],
    [
      'failed with an unsigned action still listed',
      { status: 'failed', actions: [ZAMA_UNWRAP_MINED, zamaClaimUnsigned()] },
      'failed',
    ],
    [
      'rejected with an unsigned action still listed',
      {
        status: 'rejected',
        actions: [ZAMA_UNWRAP_MINED, zamaClaimUnsigned()],
      },
      'failed',
    ],
    [
      'pending with an unsigned action',
      { status: 'pending', actions: [ZAMA_UNWRAP_MINED, zamaClaimUnsigned()] },
      'unsigned',
    ],
    [
      'pending with an unsigned action that is available later',
      {
        status: 'pending',
        actions: [ZAMA_UNWRAP_MINED, zamaClaimUnsigned(1_760_533_200)],
      },
      'unsigned',
    ],
    [
      'pending with an unsigned action and a pending one',
      {
        status: 'pending',
        actions: [BRIDGE_DESTINATION_PENDING, zamaClaimUnsigned()],
      },
      'unsigned',
    ],
    [
      'successful with an unsigned action',
      {
        status: 'successful',
        actions: [ZAMA_UNWRAP_MINED, zamaClaimUnsigned()],
      },
      'unsigned',
    ],
  ])('%s', (_label, reply, kind) => {
    expect(
      decideSubmittedOrder({ status: reply.status, actions: reply.actions })
        ?.kind ?? null
    ).toBe(kind);
  });
});

describe('getFillExplorerUrl / getDoneExplorerUrl', () => {
  test("a Fill links on the provider's explorer when the quote has one", () => {
    expect(getFillExplorerUrl(relayExplorer, FILL)).toBe(
      `https://relay.link/transaction/${FILL.hash}`
    );
  });

  test("a Fill links on the input chain's explorer otherwise", () => {
    expect(getFillExplorerUrl(inputChainExplorer, FILL)).toBe(
      `https://basescan.org/tx/${FILL.hash}`
    );
  });

  test('a Fill has no link when there is no template at all', () => {
    expect(
      getFillExplorerUrl(
        { providerTemplate: null, inputChainTemplate: null },
        FILL
      )
    ).toBeNull();
  });

  test.each<[string, string | null, OrderReply, OrderExplorer, string | null]>([
    [
      'a wallet-sent swap links its swap transaction on the provider',
      SWAP_HASH,
      BRIDGE_BOTH_MINED,
      relayExplorer,
      `https://relay.link/transaction/${SWAP_HASH}`,
    ],
    [
      'an intent links its source action on the provider',
      null,
      BRIDGE_BOTH_MINED,
      relayExplorer,
      `https://relay.link/transaction/0x${'3e9a51d0'.repeat(8)}`,
    ],
    [
      'an intent with no actions links its last Fill on the provider',
      null,
      {
        status: 'successful',
        fills: [{ chain: 'arbitrum', hash: '0xfirst' }, FILL],
      },
      relayExplorer,
      `https://relay.link/transaction/${FILL.hash}`,
    ],
    [
      "with no provider, the final action's explorer link",
      null,
      BRIDGE_BOTH_MINED,
      inputChainExplorer,
      DESTINATION_URL,
    ],
    [
      'with no provider and no actions, the last Fill on the input chain',
      null,
      {
        status: 'successful',
        fills: [{ chain: 'arbitrum', hash: '0xfirst' }, FILL],
        actions: null,
      },
      inputChainExplorer,
      `https://basescan.org/tx/${FILL.hash}`,
    ],
    [
      'no actions and no Fills: no link',
      null,
      { status: 'successful', actions: null },
      inputChainExplorer,
      null,
    ],
  ])('%s', (_label, swapHash, reply, explorer, url) => {
    expect(
      getDoneExplorerUrl(
        { fills: reply.fills ?? [], actions: reply.actions },
        swapHash,
        explorer
      )
    ).toBe(url);
  });
});

describe('followSubmittedOrder — polling behind Transaction submitted', () => {
  test('polls every 3 s for 30 s, every 5 s until 2 min, every 10 s until 5 min, every 30 s until 10 min, then stops', async () => {
    expect(SUBMITTED_FOLLOW_UP_TIMEOUT_MS).toBe(600_000);
    const api = follow({ replies: [] });

    await jest.advanceTimersByTimeAsync(600_000);
    await api.run;
    await jest.advanceTimersByTimeAsync(600_000);

    expect(api.requestTimesS).toEqual([
      ...range(0, 30, 3),
      ...range(35, 120, 5),
      ...range(130, 300, 10),
      ...range(330, 600, 30),
    ]);
    expect(api.getOrderStatus).toHaveBeenCalledTimes(11 + 18 + 18 + 10);
    expect(
      api.getOrderStatus.mock.calls.every(
        ([params]) => params.orderId === ORDER_ID && params.currency === 'eur'
      )
    ).toBe(true);
    expect(api.outcomes).toEqual([]);
    expect(jest.getTimerCount()).toBe(0);
  });

  test("an intent's first mined action decides success, with no further request", async () => {
    const api = follow({ replies: [INTENT_FILL_PENDING, INTENT_FILL_MINED] });

    await jest.advanceTimersByTimeAsync(3000);
    await api.run;
    await jest.advanceTimersByTimeAsync(60_000);

    expect(api.getOrderStatus).toHaveBeenCalledTimes(2);
    expect(api.outcomes).toEqual([
      { kind: 'success', hash: null, explorerUrl: DESTINATION_URL },
    ]);
  });

  test('a bridge with its source mined stays submitted until the destination is mined, then success', async () => {
    const api = follow({
      swapHash: SWAP_HASH,
      replies: [BRIDGE_SOURCE_ONLY, BRIDGE_SOURCE_ONLY, BRIDGE_BOTH_MINED],
    });

    await jest.advanceTimersByTimeAsync(3000);
    expect(api.getOrderStatus).toHaveBeenCalledTimes(2);
    expect(api.outcomes).toEqual([]);
    await jest.advanceTimersByTimeAsync(3000);
    await api.run;
    await jest.advanceTimersByTimeAsync(60_000);

    expect(api.getOrderStatus).toHaveBeenCalledTimes(3);
    expect(api.getOrderStatus.mock.calls.map(([params]) => params)).toEqual(
      Array(3).fill({ orderId: ORDER_ID, currency: 'eur' })
    );
    expect(api.outcomes).toEqual([
      { kind: 'success', hash: null, explorerUrl: DESTINATION_URL },
    ]);
  });

  test("successful with no actions: success, carrying the last Fill's hash and link", async () => {
    const api = follow({
      replies: [{ status: 'successful', fills: [FILL], actions: null }],
    });

    await api.run;

    expect(api.outcomes).toEqual([
      {
        kind: 'success',
        hash: FILL.hash,
        explorerUrl: `https://basescan.org/tx/${FILL.hash}`,
      },
    ]);
  });

  test("an intent with actions and several Fills: success, carrying the last Fill's hash on the provider's explorer", async () => {
    const api = follow({
      explorer: relayExplorer,
      replies: [
        INTENT_FILL_PENDING,
        {
          ...BRIDGE_BOTH_MINED,
          fills: [{ chain: 'arbitrum', hash: '0xfirst' }, FILL],
        },
      ],
    });

    await jest.advanceTimersByTimeAsync(3000);
    await api.run;

    expect(api.outcomes).toEqual([
      {
        kind: 'success',
        hash: FILL.hash,
        explorerUrl: `https://relay.link/transaction/${FILL.hash}`,
      },
    ]);
  });

  test.each(['failed', 'rejected'] as const)(
    '%s: the failed outcome',
    async (status) => {
      const api = follow({
        swapHash: SWAP_HASH,
        replies: [BRIDGE_SOURCE_ONLY, { status }],
      });

      await jest.advanceTimersByTimeAsync(3000);
      await api.run;

      expect(api.outcomes).toEqual([{ kind: 'failed', status }]);
    }
  );

  test('a failed status with an unsigned action still listed: failed, with no further request', async () => {
    const api = follow({
      swapHash: SWAP_HASH,
      replies: [
        BRIDGE_SOURCE_ONLY,
        { status: 'failed', actions: [ZAMA_UNWRAP_MINED, zamaClaimUnsigned()] },
      ],
    });

    await jest.advanceTimersByTimeAsync(3000);
    await api.run;
    await jest.advanceTimersByTimeAsync(60_000);

    expect(api.getOrderStatus).toHaveBeenCalledTimes(2);
    expect(api.outcomes).toEqual([{ kind: 'failed', status: 'failed' }]);
  });

  test('an unsigned action: complete, with no further request', async () => {
    const api = follow({
      replies: [
        BRIDGE_SOURCE_ONLY,
        {
          status: 'pending',
          actions: [ZAMA_UNWRAP_MINED, zamaClaimUnsigned()],
        },
      ],
    });

    await jest.advanceTimersByTimeAsync(3000);
    await api.run;
    await jest.advanceTimersByTimeAsync(60_000);

    expect(api.getOrderStatus).toHaveBeenCalledTimes(2);
    expect(api.outcomes).toEqual([{ kind: 'complete' }]);
  });
});

describe('followSubmittedOrder — stopping, and never throwing', () => {
  test('an abort (dismiss, unmount) stops polling with no further request', async () => {
    const api = follow({ replies: [] });

    await jest.advanceTimersByTimeAsync(6000);
    expect(api.getOrderStatus).toHaveBeenCalledTimes(3);
    api.abort.abort();
    await api.run;
    await jest.advanceTimersByTimeAsync(SUBMITTED_FOLLOW_UP_TIMEOUT_MS);

    expect(api.getOrderStatus).toHaveBeenCalledTimes(3);
    expect(api.outcomes).toEqual([]);
  });

  test('a deciding response that lands after the abort is not reported', async () => {
    let resolveReply: (response: OrderStatusResponse) => void = () => {};
    const getOrderStatus = jest.fn(
      () =>
        new Promise<OrderStatusResponse>((resolve) => {
          resolveReply = resolve;
        })
    );
    const api = follow({
      replies: [],
      depsOverride: {
        pollOrderStatus: (orderId, decide, options) =>
          pollOrderStatus(orderId, decide, { ...options, getOrderStatus }),
      },
    });

    await jest.advanceTimersByTimeAsync(0);
    api.abort.abort();
    resolveReply({ data: { status: 'successful', fills: [FILL] } });
    await api.run;

    expect(getOrderStatus).toHaveBeenCalledTimes(1);
    expect(api.outcomes).toEqual([]);
  });

  test('repeated 5xx keep the outcome unchanged and polling on to the cap', async () => {
    const api = follow({ replies: [], rest: { error: httpError(502) } });

    await jest.advanceTimersByTimeAsync(SUBMITTED_FOLLOW_UP_TIMEOUT_MS);
    await api.run;

    expect(api.getOrderStatus).toHaveBeenCalledTimes(57);
    expect(api.outcomes).toEqual([]);
    expect(api.logError).not.toHaveBeenCalled();
  });

  test('repeated 4xx keep the outcome unchanged, and five in a row stop polling', async () => {
    const api = follow({
      replies: [404, 500, 404, 400, 404, 422].map((status) => ({
        error: httpError(status),
      })),
      rest: { error: httpError(404) },
    });

    await jest.advanceTimersByTimeAsync(60_000);
    await api.run;
    await jest.advanceTimersByTimeAsync(SUBMITTED_FOLLOW_UP_TIMEOUT_MS);

    // a 5xx does not count toward the five: 404 500 404 400 404 422
    expect(api.getOrderStatus).toHaveBeenCalledTimes(6);
    expect(api.outcomes).toEqual([]);
    expect(api.logError).not.toHaveBeenCalled();
  });

  test('an error thrown while following is logged, never thrown', async () => {
    const api = follow({
      replies: [],
      depsOverride: {
        pollOrderStatus: () => Promise.reject(new Error('boom')),
      },
    });

    await expect(api.run).resolves.toBeUndefined();

    expect(api.outcomes).toEqual([]);
    expect(api.logError).toHaveBeenCalledWith(
      'Following a submitted order failed',
      { orderId: ORDER_ID, error: 'boom' }
    );
  });
});

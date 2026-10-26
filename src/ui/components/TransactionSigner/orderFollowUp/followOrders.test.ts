import {
  afterEach,
  beforeEach,
  describe,
  expect,
  jest,
  test,
} from '@jest/globals';
import type {
  OrderActionWire,
  OrderFill,
  OrderStatus,
  Response as OrderStatusResponse,
} from 'src/modules/zerion-api/requests/transaction-get-order-status';
import type { Quote2 } from 'src/shared/types/Quote';
import type { MultichainTransaction } from 'src/shared/types/MultichainTransaction';
import type { TransactionContextParams } from 'src/shared/types/SignatureContextParams';
import type { QueueRecord } from '../store';
import type { SignStep, StepResult, ToasterView } from '../types';
import {
  BRIDGE_DESTINATION_MINED,
  BRIDGE_DESTINATION_PENDING,
  BRIDGE_SOURCE_MINED,
  ZAMA_UNWRAP_MINED,
  zamaClaimUnsigned,
} from './orderActions.fixtures';
import type { OrderOutcome } from './followSubmittedOrder';
import type { OrderFollowUpDeps } from './followOrders';

const walletPortRequest = jest.fn(async (method: string): Promise<unknown> => {
  if (method === 'getWalletGroupByAddress') {
    return { walletContainer: { seedType: 1, wallets: [] } };
  }
  throw new Error(`Unexpected walletPort method ${method}`);
});

jest.unstable_mockModule('src/ui/shared/channels', () => ({
  walletPort: { request: walletPortRequest },
}));
jest.unstable_mockModule('src/modules/zerion-api/zerion-api.client', () => ({
  ZerionAPI: { transactionGetOrderStatus: jest.fn() },
}));
jest.unstable_mockModule('src/ui/features/appearance', () => ({
  preferenceStore: { getState: () => ({ currency: 'usd' }) },
}));
jest.unstable_mockModule(
  'src/ui/hardware-wallet/useLedgerIframeController',
  () => ({ postLedgerSignParams: () => undefined })
);
jest.unstable_mockModule('../refreshStaleGas', () => ({
  isStepStale: () => false,
  refreshStaleGasForStep: async (step: SignStep) => step,
}));

const { appendQueue, emitQueueEvent, getQueue, removeQueue } = await import(
  '../store'
);
const { runQueue } = await import('../runQueue');
const { startOrderFollowUps } = await import('./followOrders');
const { INTENT_STATUS_WAIT_MS, SUBMITTED_FOLLOW_UP_TIMEOUT_MS } = await import(
  './followSubmittedOrder'
);
const { getFollowUpOutcome, isFollowUpActive, subscribeFollowUp } =
  await import('./followUpStore');

const ADDRESS = '0x42b9df65b219b3dd36ff330a4dd8f327a6ada990';
const ORDER_ID = 'relay:order-1';
const SWAP_HASH = `0x${'ab'.repeat(32)}`;
const CURRENCY = 'eur';
const INPUT_EXPLORER = 'https://basescan.org/tx/{HASH}';
const LAST_FILL: OrderFill = { chain: 'base', hash: `0x${'3e'.repeat(32)}` };

interface OrderReply {
  status: OrderStatus;
  fills?: OrderFill[];
  actions?: OrderActionWire[] | null;
}

const PENDING_NO_ACTIONS: OrderReply = { status: 'pending', actions: [] };
const BRIDGE_SOURCE_ONLY: OrderReply = {
  status: 'pending',
  actions: [BRIDGE_SOURCE_MINED, BRIDGE_DESTINATION_PENDING],
};
const BRIDGE_BOTH_MINED: OrderReply = {
  status: 'pending',
  actions: [BRIDGE_SOURCE_MINED, BRIDGE_DESTINATION_MINED],
};
const CLAIM_UNSIGNED: OrderReply = {
  status: 'pending',
  actions: [ZAMA_UNWRAP_MINED, zamaClaimUnsigned()],
};

const context: TransactionContextParams = {
  chain: 'base',
  feeValueCommon: '0',
  initiator: 'chrome-extension://id',
  clientScope: 'Swap',
  addressAction: null,
};

const quote = {
  quoteId: 'q-1',
  contractMetadata: { id: 'zerox', name: '0x', iconUrl: '', explorer: null },
} as unknown as Quote2;

const toaster: ToasterView = {
  kind: 'swap',
  explorerUrlTemplate: INPUT_EXPLORER,
  sent: { symbol: 'USDC', iconUrl: null },
  received: { symbol: 'ETH', iconUrl: null },
  receivedChain: { iconUrl: null },
};

const orderStep: SignStep = {
  kind: 'order',
  params: { ...context, quote, outputChain: 'base', expected: null },
  toaster,
};

const walletSentSwapStep: SignStep = {
  kind: 'send',
  params: {
    ...context,
    quote,
    outputChain: 'arbitrum',
    transaction: { evm: { to: '0xrouter' } } as MultichainTransaction,
    orderReport: { quoteId: 'q-1', role: 'swap' },
  },
  toaster: { ...toaster, kind: 'bridge' },
};

/** A get-order-status that replays `replies`, then repeats the last one, recording every request */
function scriptOrderStatus(replies: OrderReply[]) {
  const queue = [...replies];
  let last = replies.at(-1) ?? PENDING_NO_ACTIONS;
  const startedAt = Date.now();
  const requestTimesS: number[] = [];
  const getOrderStatus = jest.fn(
    async (_params: {
      orderId: string;
      currency: string;
    }): Promise<OrderStatusResponse> => {
      requestTimesS.push((Date.now() - startedAt) / 1000);
      const reply = queue.shift() ?? last;
      last = reply;
      return {
        data: {
          status: reply.status,
          fills: reply.fills ?? [],
          actions: reply.actions,
        },
      };
    }
  );
  return { getOrderStatus, requestTimesS };
}

let stops: Array<() => void> = [];
let queueIds: string[] = [];

function startFollowUps(
  getOrderStatus: OrderFollowUpDeps['getOrderStatus'],
  reportedOrderId: string | null = ORDER_ID
) {
  const getReportedSwapOrderId = jest.fn(async (_swapHash: string) => {
    return reportedOrderId;
  });
  stops.push(
    startOrderFollowUps({
      getOrderStatus,
      getReportedSwapOrderId,
      getCurrency: () => CURRENCY,
    })
  );
  return { getReportedSwapOrderId };
}

/** Records every outcome the follow-up store publishes for `queueId` */
function recordOutcomes(queueId: string) {
  const outcomes: OrderOutcome[] = [];
  stops.push(
    subscribeFollowUp((id, outcome) => {
      if (id === queueId && outcome) outcomes.push(outcome);
    })
  );
  return outcomes;
}

function enqueue(step: SignStep) {
  const { queueId, promise } = appendQueue([step], {
    wallet: { address: ADDRESS, name: null },
    holdToSign: false,
    bluetoothSupportEnabled: null,
  });
  promise.catch(() => null);
  queueIds.push(queueId);
  return queueId;
}

function placeIntentOrder(queueId: string) {
  emitQueueEvent(queueId, { type: 'step-start', index: 0 });
  emitQueueEvent(queueId, {
    type: 'step-order-placed',
    index: 0,
    orderId: ORDER_ID,
  });
  emitQueueEvent(queueId, {
    type: 'step-success',
    index: 0,
    result: { order: { orderId: ORDER_ID } },
  });
}

function mineWalletSentSwap(queueId: string) {
  emitQueueEvent(queueId, { type: 'step-start', index: 0 });
  emitQueueEvent(queueId, {
    type: 'step-pending',
    index: 0,
    txHash: SWAP_HASH,
  });
  emitQueueEvent(queueId, {
    type: 'step-success',
    index: 0,
    result: { evm: { hash: SWAP_HASH } } as StepResult,
  });
}

function expectEveryRequestCarriesCurrency(
  getOrderStatus: ReturnType<typeof scriptOrderStatus>['getOrderStatus']
) {
  expect(getOrderStatus.mock.calls.length).toBeGreaterThan(0);
  for (const [params] of getOrderStatus.mock.calls) {
    expect(params).toEqual({ orderId: ORDER_ID, currency: CURRENCY });
  }
}

beforeEach(() => {
  jest.useFakeTimers();
  stops = [];
  queueIds = [];
});
afterEach(() => {
  stops.forEach((stop) => stop());
  queueIds.forEach((queueId) => removeQueue(queueId));
  jest.useRealTimers();
});

describe('an intent order after step-order-placed', () => {
  test.each<[string, OrderReply, OrderOutcome]>([
    [
      'successful: success, linking the last Fill',
      {
        status: 'successful',
        fills: [{ chain: 'base', hash: '0xfirst' }, LAST_FILL],
        actions: null,
      },
      {
        kind: 'success',
        hash: LAST_FILL.hash,
        explorerUrl: `https://basescan.org/tx/${LAST_FILL.hash}`,
      },
    ],
    [
      'failed: failed',
      { status: 'failed' },
      { kind: 'failed', status: 'failed' },
    ],
    [
      'rejected: failed',
      { status: 'rejected' },
      { kind: 'failed', status: 'rejected' },
    ],
    ['an unsigned action: complete', CLAIM_UNSIGNED, { kind: 'complete' }],
  ])('%s', async (_label, reply, outcome) => {
    const api = scriptOrderStatus([reply]);
    startFollowUps(api.getOrderStatus);
    const queueId = enqueue(orderStep);
    const outcomes = recordOutcomes(queueId);

    placeIntentOrder(queueId);
    await jest.advanceTimersByTimeAsync(SUBMITTED_FOLLOW_UP_TIMEOUT_MS);

    expect(outcomes).toEqual([outcome]);
    expect(api.getOrderStatus).toHaveBeenCalledTimes(1);
    expectEveryRequestCarriesCurrency(api.getOrderStatus);
  });

  test('still pending at 5000 ms: submitted, then followed in place until the order is done', async () => {
    const api = scriptOrderStatus([
      PENDING_NO_ACTIONS,
      PENDING_NO_ACTIONS,
      PENDING_NO_ACTIONS,
      BRIDGE_SOURCE_ONLY,
      BRIDGE_SOURCE_ONLY,
      BRIDGE_BOTH_MINED,
    ]);
    startFollowUps(api.getOrderStatus);
    const queueId = enqueue(orderStep);
    const outcomes = recordOutcomes(queueId);

    placeIntentOrder(queueId);
    await jest.advanceTimersByTimeAsync(INTENT_STATUS_WAIT_MS - 1);
    expect(outcomes).toEqual([]);
    expect(getFollowUpOutcome(queueId)).toBeNull();

    await jest.advanceTimersByTimeAsync(1);
    expect(outcomes).toEqual([{ kind: 'submitted' }]);
    expect(api.requestTimesS).toEqual([0, 3, 5, 5]);

    await jest.advanceTimersByTimeAsync(3000);
    expect(outcomes).toEqual([{ kind: 'submitted' }]);
    await jest.advanceTimersByTimeAsync(3000);
    expect(outcomes).toEqual([
      { kind: 'submitted' },
      {
        kind: 'success',
        hash: null,
        explorerUrl: `https://etherscan.io/tx/0x${'b2d4f6a8'.repeat(8)}`,
      },
    ]);
    expect(api.requestTimesS).toEqual([0, 3, 5, 5, 8, 11]);
    expect(isFollowUpActive(queueId)).toBe(false);
    expectEveryRequestCarriesCurrency(api.getOrderStatus);
  });

  test('a pending action at the first read: submitted at once, then complete when the next step needs a signature', async () => {
    const api = scriptOrderStatus([
      BRIDGE_SOURCE_ONLY,
      BRIDGE_SOURCE_ONLY,
      CLAIM_UNSIGNED,
    ]);
    startFollowUps(api.getOrderStatus);
    const queueId = enqueue(orderStep);
    const outcomes = recordOutcomes(queueId);

    placeIntentOrder(queueId);
    await jest.advanceTimersByTimeAsync(0);
    expect(outcomes).toEqual([{ kind: 'submitted' }]);

    await jest.advanceTimersByTimeAsync(3000);
    expect(outcomes).toEqual([{ kind: 'submitted' }, { kind: 'complete' }]);
    expect(api.requestTimesS).toEqual([0, 0, 3]);
    expectEveryRequestCarriesCurrency(api.getOrderStatus);
  });

  test('still pending at the 10 min cap: stays submitted and stops polling', async () => {
    const api = scriptOrderStatus([PENDING_NO_ACTIONS]);
    startFollowUps(api.getOrderStatus);
    const queueId = enqueue(orderStep);
    const outcomes = recordOutcomes(queueId);

    placeIntentOrder(queueId);
    await jest.advanceTimersByTimeAsync(
      INTENT_STATUS_WAIT_MS + SUBMITTED_FOLLOW_UP_TIMEOUT_MS
    );
    const requests = api.getOrderStatus.mock.calls.length;
    await jest.advanceTimersByTimeAsync(SUBMITTED_FOLLOW_UP_TIMEOUT_MS);

    expect(outcomes).toEqual([{ kind: 'submitted' }]);
    expect(api.getOrderStatus).toHaveBeenCalledTimes(requests);
    expect(api.requestTimesS.at(-1)).toBe(
      (INTENT_STATUS_WAIT_MS + SUBMITTED_FOLLOW_UP_TIMEOUT_MS) / 1000
    );
    expect(isFollowUpActive(queueId)).toBe(false);
    expectEveryRequestCarriesCurrency(api.getOrderStatus);
  });

  test('stopping the follow-ups (unmount) aborts polling', async () => {
    const api = scriptOrderStatus([PENDING_NO_ACTIONS]);
    startFollowUps(api.getOrderStatus);
    const queueId = enqueue(orderStep);
    const outcomes = recordOutcomes(queueId);

    placeIntentOrder(queueId);
    await jest.advanceTimersByTimeAsync(INTENT_STATUS_WAIT_MS + 6000);
    const requests = api.getOrderStatus.mock.calls.length;
    stops.shift()?.();
    await jest.advanceTimersByTimeAsync(SUBMITTED_FOLLOW_UP_TIMEOUT_MS);

    expect(outcomes).toEqual([{ kind: 'submitted' }]);
    expect(api.getOrderStatus).toHaveBeenCalledTimes(requests);
    expect(getFollowUpOutcome(queueId)).toBeNull();
  });
});

describe('a wallet-sent swap after its receipt', () => {
  test('a cross-chain swap whose destination is still pending: submitted, not success', async () => {
    const api = scriptOrderStatus([BRIDGE_SOURCE_ONLY]);
    const { getReportedSwapOrderId } = startFollowUps(api.getOrderStatus);
    const queueId = enqueue(walletSentSwapStep);
    const outcomes = recordOutcomes(queueId);

    mineWalletSentSwap(queueId);
    await jest.advanceTimersByTimeAsync(0);

    expect(getReportedSwapOrderId).toHaveBeenCalledWith(SWAP_HASH);
    expect(outcomes).toEqual([{ kind: 'submitted' }]);
    expectEveryRequestCarriesCurrency(api.getOrderStatus);
  });

  test('a same-chain swap whose actions are all mined: success as today', async () => {
    const api = scriptOrderStatus([BRIDGE_BOTH_MINED]);
    startFollowUps(api.getOrderStatus);
    const queueId = enqueue(walletSentSwapStep);
    const outcomes = recordOutcomes(queueId);

    mineWalletSentSwap(queueId);
    await jest.advanceTimersByTimeAsync(SUBMITTED_FOLLOW_UP_TIMEOUT_MS);

    expect(outcomes).toEqual([
      { kind: 'success', hash: null, explorerUrl: null },
    ]);
    expect(api.getOrderStatus).toHaveBeenCalledTimes(1);
    expectEveryRequestCarriesCurrency(api.getOrderStatus);
  });

  test('no reported order id: success as today, with no order read', async () => {
    const api = scriptOrderStatus([BRIDGE_SOURCE_ONLY]);
    startFollowUps(api.getOrderStatus, null);
    const queueId = enqueue(walletSentSwapStep);
    const outcomes = recordOutcomes(queueId);

    mineWalletSentSwap(queueId);
    await jest.advanceTimersByTimeAsync(SUBMITTED_FOLLOW_UP_TIMEOUT_MS);

    expect(outcomes).toEqual([
      { kind: 'success', hash: null, explorerUrl: null },
    ]);
    expect(api.getOrderStatus).not.toHaveBeenCalled();
  });

  test('`actions: null`: success as today', async () => {
    const api = scriptOrderStatus([{ status: 'pending', actions: null }]);
    startFollowUps(api.getOrderStatus);
    const queueId = enqueue(walletSentSwapStep);
    const outcomes = recordOutcomes(queueId);

    mineWalletSentSwap(queueId);
    await jest.advanceTimersByTimeAsync(SUBMITTED_FOLLOW_UP_TIMEOUT_MS);

    expect(outcomes).toEqual([
      { kind: 'success', hash: null, explorerUrl: null },
    ]);
    expect(api.getOrderStatus).toHaveBeenCalledTimes(1);
    expectEveryRequestCarriesCurrency(api.getOrderStatus);
  });

  test('an unsigned action (a Zama Claim): complete', async () => {
    const api = scriptOrderStatus([CLAIM_UNSIGNED]);
    startFollowUps(api.getOrderStatus);
    const queueId = enqueue(walletSentSwapStep);
    const outcomes = recordOutcomes(queueId);

    mineWalletSentSwap(queueId);
    await jest.advanceTimersByTimeAsync(SUBMITTED_FOLLOW_UP_TIMEOUT_MS);

    expect(outcomes).toEqual([{ kind: 'complete' }]);
    expect(api.getOrderStatus).toHaveBeenCalledTimes(1);
  });

  test('a swap that fails on chain is not followed', async () => {
    const api = scriptOrderStatus([BRIDGE_SOURCE_ONLY]);
    startFollowUps(api.getOrderStatus);
    const queueId = enqueue(walletSentSwapStep);

    emitQueueEvent(queueId, {
      type: 'step-pending',
      index: 0,
      txHash: SWAP_HASH,
    });
    emitQueueEvent(queueId, {
      type: 'step-error',
      index: 0,
      error: new Error('reverted'),
    });
    await jest.advanceTimersByTimeAsync(SUBMITTED_FOLLOW_UP_TIMEOUT_MS);

    expect(api.getOrderStatus).not.toHaveBeenCalled();
    expect(isFollowUpActive(queueId)).toBe(false);
  });
});

describe('the follow-up runs outside the queue', () => {
  test('a second queue starts and finishes while the first order is still followed', async () => {
    const api = scriptOrderStatus([PENDING_NO_ACTIONS]);
    startFollowUps(api.getOrderStatus);
    const runStep = async ({
      queue,
      step,
      index,
    }: {
      queue: QueueRecord;
      step: SignStep;
      index: number;
    }): Promise<StepResult> => {
      if (step.kind === 'order') {
        emitQueueEvent(queue.queueId, {
          type: 'step-order-placed',
          index,
          orderId: ORDER_ID,
        });
        return { order: { orderId: ORDER_ID } };
      }
      return { evm: { hash: '0xsecond' } } as StepResult;
    };

    const first = enqueue(orderStep);
    const firstQueue = getQueue(first);
    if (!firstQueue) throw new Error('first queue not appended');
    await runQueue(firstQueue, runStep);
    expect(firstQueue.run).toEqual({
      state: 'done',
      results: [{ order: { orderId: ORDER_ID } }],
    });
    await jest.advanceTimersByTimeAsync(INTENT_STATUS_WAIT_MS);
    expect(getFollowUpOutcome(first)).toEqual({ kind: 'submitted' });
    expect(isFollowUpActive(first)).toBe(true);

    const second = enqueue({
      ...walletSentSwapStep,
      params: context,
    } as SignStep);
    const secondQueue = getQueue(second);
    if (!secondQueue) throw new Error('second queue not appended');
    await runQueue(secondQueue, runStep);

    expect(secondQueue.run.state).toBe('done');
    expect(isFollowUpActive(first)).toBe(true);
  });
});

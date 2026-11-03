import { isDeviceAccount } from 'src/shared/types/validators';
import { walletPort } from 'src/ui/shared/channels';
import { preferenceStore } from 'src/ui/features/appearance';
import { getQueue, subscribeQueueEvent } from '../store';
import type { SignStep } from '../types';
import {
  INTENT_STATUS_WAIT_MS,
  followSubmittedOrder,
  getFillExplorerUrl,
  type OrderExplorer,
  type OrderOutcome,
} from './followSubmittedOrder';
import {
  beginFollowUp,
  cancelAllFollowUps,
  cancelFollowUp,
  endFollowUp,
  setFollowUpOutcome,
} from './followUpStore';
import {
  defaultGetOrderStatus,
  pollOrderStatus,
  readOrderNextStep,
  type OrderStatusData,
  type PollOrderStatusDeps,
} from './waitForOrderStatus';

export interface OrderFollowUpDeps {
  getOrderStatus: PollOrderStatusDeps['getOrderStatus'];
  getReportedSwapOrderId: (swapHash: string) => Promise<string | null>;
  getCurrency: () => string;
}

const defaultDeps: OrderFollowUpDeps = {
  getOrderStatus: defaultGetOrderStatus,
  getReportedSwapOrderId: (swapHash) =>
    walletPort.request('uiGetReportedSwapOrderId', { swapHash }),
  getCurrency: () => preferenceStore.getState().currency,
};

interface FollowParams {
  explorer: OrderExplorer;
  currency: string;
  signal: AbortSignal;
  onOutcome: (outcome: OrderOutcome) => void;
}

function followLive(
  orderId: string,
  swapHash: string | null,
  params: FollowParams,
  deps: OrderFollowUpDeps
) {
  params.onOutcome({ kind: 'submitted' });
  return followSubmittedOrder(
    { orderId, swapHash, ...params },
    {
      pollOrderStatus: (id, decide, options) =>
        pollOrderStatus(id, decide, {
          ...options,
          getOrderStatus: deps.getOrderStatus,
        }),
    }
  );
}

function decideIntentOrder(
  { status, actions, fills }: OrderStatusData,
  explorer: OrderExplorer
): OrderOutcome | null {
  const next = readOrderNextStep(status, actions);
  if (next === 'unsigned') {
    return { kind: 'complete' };
  }
  if (status === 'failed' || status === 'rejected') {
    return { kind: 'failed', status };
  }
  if (status === 'successful') {
    const lastFill = fills.at(-1);
    return {
      kind: 'success',
      hash: lastFill?.hash ?? null,
      explorerUrl: lastFill ? getFillExplorerUrl(explorer, lastFill) : null,
    };
  }
  return null;
}

/**
 * Reads a placed intent order for up to `INTENT_STATUS_WAIT_MS`; an order
 * still pending by then is reported as submitted and followed live.
 */
export async function followIntentOrder(
  orderId: string,
  params: FollowParams,
  deps: OrderFollowUpDeps = defaultDeps
): Promise<void> {
  const result = await pollOrderStatus(
    orderId,
    (data) => decideIntentOrder(data, params.explorer),
    {
      getOrderStatus: deps.getOrderStatus,
      signal: params.signal,
      currency: params.currency,
      timeoutMs: INTENT_STATUS_WAIT_MS,
    }
  );
  if (result.kind === 'aborted' || params.signal.aborted) {
    return;
  }
  if (result.kind === 'unknown-order') {
    params.onOutcome({ kind: 'failed', status: 'failed' });
    return;
  }
  if (result.kind === 'decided') {
    params.onOutcome(result.decision);
    return;
  }
  await followLive(orderId, null, params, deps);
}

const SUCCESS_AS_SENT: OrderOutcome = {
  kind: 'success',
  hash: null,
  explorerUrl: null,
};

async function readWalletSentOrder(
  swapHash: string,
  currency: string,
  deps: OrderFollowUpDeps
): Promise<{ orderId: string; data: OrderStatusData } | null> {
  try {
    const orderId = await deps.getReportedSwapOrderId(swapHash);
    if (!orderId) {
      return null;
    }
    const { data } = await deps.getOrderStatus({ orderId, currency });
    return { orderId, data };
  } catch {
    return null;
  }
}

/**
 * Reads the order of a mined wallet-sent swap once: an unsigned action means
 * complete, a pending order with a pending action is followed live, anything
 * else (no order, no actions, a failed read) is the receipt's success.
 */
export async function followWalletSentSwap(
  swapHash: string,
  params: FollowParams,
  deps: OrderFollowUpDeps = defaultDeps
): Promise<void> {
  const order = await readWalletSentOrder(swapHash, params.currency, deps);
  if (params.signal.aborted) {
    return;
  }
  const next = order
    ? readOrderNextStep(order.data.status, order.data.actions)
    : null;
  if (order && next === 'pending') {
    await followLive(order.orderId, swapHash, params, deps);
  } else {
    params.onOutcome(
      next === 'unsigned' ? { kind: 'complete' } : SUCCESS_AS_SENT
    );
  }
}

export type FollowedStepKind = 'intent' | 'wallet-sent-swap';

export function getFollowedStepKind(
  step: SignStep | undefined
): FollowedStepKind | null {
  if (step?.kind === 'order') {
    return 'intent';
  }
  if (step?.kind === 'send' && step.params.orderReport?.role === 'swap') {
    return 'wallet-sent-swap';
  }
  return null;
}

function getStepExplorer(step: SignStep): OrderExplorer {
  const providerTemplate =
    step.params.quote?.contractMetadata.explorer?.txUrl ?? null;
  return {
    providerTemplate,
    inputChainTemplate: step.toaster?.explorerUrlTemplate ?? null,
  };
}

/**
 * Follows every intent order and wallet-sent swap the queue runs, outside the
 * queue, publishing outcomes to the follow-up store by queueId. A follow-up
 * is registered before its step's `step-success`, so the toaster can tell a
 * followed step from a plain one. The returned stop function unsubscribes
 * and aborts every follow-up.
 */
export function startOrderFollowUps(
  deps: OrderFollowUpDeps = defaultDeps
): () => void {
  const sentSwaps = new Map<
    string,
    { swapHash: string; signal: AbortSignal }
  >();

  function run(
    queueId: string,
    step: SignStep,
    signal: AbortSignal,
    follow: (params: FollowParams) => Promise<void>
  ) {
    void follow({
      explorer: getStepExplorer(step),
      currency: deps.getCurrency(),
      signal,
      onOutcome: (outcome) => setFollowUpOutcome(queueId, signal, outcome),
    }).finally(() => endFollowUp(queueId, signal));
  }

  const unsubscribe = subscribeQueueEvent((queueId, event) => {
    const queue = getQueue(queueId);
    if (!queue || isDeviceAccount(queue.options.wallet)) return;
    if (event.type === 'step-error' || event.type === 'queue-aborted') {
      if (sentSwaps.delete(queueId)) {
        cancelFollowUp(queueId);
      }
      return;
    }
    if (!('index' in event)) return;
    const step = queue.steps[event.index];
    const kind = getFollowedStepKind(step);
    if (kind === 'intent' && event.type === 'step-order-placed') {
      const signal = beginFollowUp(queueId);
      run(queueId, step, signal, (params) =>
        followIntentOrder(event.orderId, params, deps)
      );
    } else if (kind === 'wallet-sent-swap' && event.type === 'step-pending') {
      const signal = beginFollowUp(queueId);
      sentSwaps.set(queueId, { swapHash: event.txHash, signal });
    } else if (kind === 'wallet-sent-swap' && event.type === 'step-success') {
      const sent = sentSwaps.get(queueId);
      sentSwaps.delete(queueId);
      if (sent) {
        run(queueId, step, sent.signal, (params) =>
          followWalletSentSwap(sent.swapHash, params, deps)
        );
      }
    }
  });

  return () => {
    unsubscribe();
    sentSwaps.clear();
    cancelAllFollowUps();
  };
}

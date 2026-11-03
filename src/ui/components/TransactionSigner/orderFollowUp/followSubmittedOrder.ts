import type { OrderFill } from 'src/modules/zerion-api/requests/transaction-get-order-status';
import {
  pollOrderStatus as defaultPollOrderStatus,
  type OrderStatusData,
} from './waitForOrderStatus';

/** How long the order behind a `submitted` toaster is followed before it is left as it is */
export const SUBMITTED_FOLLOW_UP_TIMEOUT_MS = 10 * 60 * 1000;

/** How long an intent order is polled before the toaster ends as submitted */
export const INTENT_STATUS_WAIT_MS = 5000;

/** Every 3 s for 30 s, every 5 s until 2 min, every 10 s until 5 min, then every 30 s */
export function submittedFollowUpIntervalMs(elapsedMs: number): number {
  if (elapsedMs < 30_000) {
    return 3000;
  }
  if (elapsedMs < 2 * 60_000) {
    return 5000;
  }
  if (elapsedMs < 5 * 60_000) {
    return 10_000;
  }
  return 30_000;
}

export type SubmittedOrderDecision =
  | { kind: 'unsigned' }
  | { kind: 'failed'; status: 'failed' | 'rejected' }
  | { kind: 'done' };

/**
 * Which outcome a get-order-status response decides for `submitted`, in
 * precedence order; null while some action is still pending
 */
export function decideSubmittedOrder({
  status,
  actions,
}: Pick<OrderStatusData, 'status' | 'actions'>): SubmittedOrderDecision | null {
  if (status === 'failed' || status === 'rejected') {
    return { kind: 'failed', status };
  }
  const orderActions = Array.isArray(actions) ? actions : [];
  if (orderActions.some((action) => action.state === 'unsigned')) {
    return { kind: 'unsigned' };
  }
  if (
    status === 'successful' ||
    (orderActions.length > 0 &&
      orderActions.every((action) => action.state === 'mined'))
  ) {
    return { kind: 'done' };
  }
  return null;
}

/** `{HASH}` templates an order's explorer link is built from */
export interface OrderExplorer {
  /** The provider's own explorer (`quote.contractMetadata.explorer.txUrl`) */
  providerTemplate: string | null;
  /** The input chain's explorer */
  inputChainTemplate: string | null;
}

export type OrderOutcome =
  | { kind: 'submitted' }
  | { kind: 'complete' }
  | { kind: 'failed'; status: 'failed' | 'rejected' }
  /** A null `hash` / `explorerUrl` keeps whatever the step already shows */
  | { kind: 'success'; hash: string | null; explorerUrl: string | null };

/** A Fill's hash on the provider's explorer, else the input chain's */
export function getFillExplorerUrl(
  { providerTemplate, inputChainTemplate }: OrderExplorer,
  fill: OrderFill
): string | null {
  const template = providerTemplate || inputChainTemplate;
  return template ? template.replace('{HASH}', fill.hash) : null;
}

/** The first action's transaction */
function getSourceHash(actions: OrderStatusData['actions']): string | null {
  const sourceAction = Array.isArray(actions) ? actions.at(0) : undefined;
  const sourceAct = sourceAction?.acts.find((act) => act.transaction?.hash);
  return sourceAct?.transaction?.hash ?? null;
}

/**
 * The provider's explorer with the source transaction when the quote has one,
 * else the final action's chain-explorer link, else the last Fill's
 */
export function getDoneExplorerUrl(
  { actions, fills }: Pick<OrderStatusData, 'actions' | 'fills'>,
  swapHash: string | null,
  explorer: OrderExplorer
): string | null {
  const sourceHash = swapHash ?? getSourceHash(actions);
  if (explorer.providerTemplate && sourceHash) {
    return explorer.providerTemplate.replace('{HASH}', sourceHash);
  }
  const finalAction = Array.isArray(actions) ? actions.at(-1) : undefined;
  const actionUrl = finalAction?.acts
    .map((act) => act.transaction?.explorerUrl)
    .filter(Boolean)
    .at(-1);
  if (actionUrl) {
    return actionUrl;
  }
  const lastFill = fills.at(-1);
  return lastFill ? getFillExplorerUrl(explorer, lastFill) : null;
}

export interface FollowSubmittedOrderParams {
  orderId: string;
  /** The wallet-sent swap transaction; null for an intent */
  swapHash: string | null;
  explorer: OrderExplorer;
  currency: string;
  /** Aborted on dismiss and on unmount */
  signal: AbortSignal;
  onOutcome: (outcome: OrderOutcome) => void;
}

export interface FollowSubmittedOrderDeps {
  pollOrderStatus: typeof defaultPollOrderStatus<{
    decision: SubmittedOrderDecision;
    data: OrderStatusData;
  }>;
  logError: (message: string, details: Record<string, unknown>) => void;
}

const defaultDeps: FollowSubmittedOrderDeps = {
  pollOrderStatus: defaultPollOrderStatus,
  logError: (message, details) => {
    // eslint-disable-next-line no-console
    console.error(message, details);
  },
};

/**
 * Keeps polling a submitted order until a response decides the outcome
 * (`decideSubmittedOrder`), then reports complete, failed or success. Request
 * errors, the timeout and an abort leave the outcome as it is; never rejects.
 */
export async function followSubmittedOrder(
  {
    orderId,
    swapHash,
    explorer,
    currency,
    signal,
    onOutcome,
  }: FollowSubmittedOrderParams,
  depsOverride: Partial<FollowSubmittedOrderDeps> = {}
): Promise<void> {
  const deps: FollowSubmittedOrderDeps = { ...defaultDeps, ...depsOverride };
  try {
    const result = await deps.pollOrderStatus(
      orderId,
      (data) => {
        const decision = decideSubmittedOrder(data);
        return decision ? { decision, data } : null;
      },
      {
        signal,
        currency,
        timeoutMs: SUBMITTED_FOLLOW_UP_TIMEOUT_MS,
        intervalMs: submittedFollowUpIntervalMs,
      }
    );
    if (result.kind !== 'decided' || signal.aborted) {
      return;
    }
    const { decision, data } = result.decision;
    if (decision.kind === 'unsigned') {
      onOutcome({ kind: 'complete' });
    } else if (decision.kind === 'failed') {
      onOutcome({ kind: 'failed', status: decision.status });
    } else {
      const lastFill = swapHash ? undefined : data.fills.at(-1);
      onOutcome({
        kind: 'success',
        hash: lastFill?.hash ?? null,
        explorerUrl: lastFill
          ? getFillExplorerUrl(explorer, lastFill)
          : getDoneExplorerUrl(data, swapHash, explorer),
      });
    }
  } catch (error) {
    deps.logError('Following a submitted order failed', {
      orderId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

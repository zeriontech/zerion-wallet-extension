import { HTTPError } from 'ky';
import { ZerionAPI } from 'src/modules/zerion-api/zerion-api.client';
import type {
  OrderActionWire,
  OrderStatus,
  Params as OrderStatusParams,
  Response as OrderStatusResponse,
} from 'src/modules/zerion-api/requests/transaction-get-order-status';

export type OrderStatusData = OrderStatusResponse['data'];

/** An `unsigned` action awaits the user's signature; `pending` means a sent step is still confirming */
export type OrderNextStep = 'unsigned' | 'pending';

export function readOrderNextStep(
  status: OrderStatus,
  actions: OrderActionWire[] | null | undefined
): OrderNextStep | null {
  if (!Array.isArray(actions) || status === 'failed' || status === 'rejected') {
    return null;
  }
  if (actions.some((action) => action.state === 'unsigned')) {
    return 'unsigned';
  }
  return status === 'pending' &&
    actions.some((action) => action.state === 'pending')
    ? 'pending'
    : null;
}

const FAST_INTERVAL_MS = 3000;
const SLOW_INTERVAL_MS = 15000;
const SLOW_DOWN_AFTER_MS = 2 * 60 * 1000;
const DEFAULT_TIMEOUT_MS = 5 * 60 * 1000;
/** Consecutive "unknown order" (4xx) responses before giving up on the order */
const MAX_CONSECUTIVE_CLIENT_ERRORS = 5;

function defaultIntervalMs(elapsedMs: number) {
  return elapsedMs < SLOW_DOWN_AFTER_MS ? FAST_INTERVAL_MS : SLOW_INTERVAL_MS;
}

/** Resolves when `ms` elapse or `signal` aborts, whichever comes first */
function sleepUnlessAborted(
  sleep: (ms: number) => Promise<void>,
  ms: number,
  signal: AbortSignal | undefined
): Promise<void> {
  if (!signal) {
    return sleep(ms);
  }
  if (signal.aborted) {
    return Promise.resolve();
  }
  return new Promise<void>((resolve) => {
    const done = () => {
      signal.removeEventListener('abort', done);
      resolve();
    };
    signal.addEventListener('abort', done);
    sleep(ms).then(done, done);
  });
}

function isClientError(error: unknown) {
  return (
    error instanceof HTTPError &&
    error.response.status >= 400 &&
    error.response.status < 500
  );
}

export function defaultGetOrderStatus(params: Required<OrderStatusParams>) {
  return ZerionAPI.transactionGetOrderStatus(params);
}

export interface PollOrderStatusDeps {
  getOrderStatus: (
    params: Required<OrderStatusParams>
  ) => Promise<OrderStatusResponse>;
  sleep: (ms: number) => Promise<void>;
  now: () => number;
  timeoutMs: number;
  signal: AbortSignal;
  /** Without it the backend returns `actions: null` */
  currency: string;
  /** The wait before the next request, by time since polling started */
  intervalMs: (elapsedMs: number) => number;
}

export type PollOrderStatusResult<T> =
  | { kind: 'decided'; decision: T }
  /** Consecutive 4xx responses: the backend does not know the order */
  | { kind: 'unknown-order' }
  | { kind: 'timeout' }
  | { kind: 'aborted' };

/**
 * Polls `transaction/get-order-status` (by default every 3 s, then every
 * 15 s after 2 min) until `decide` returns non-null for a response. On
 * timeout it resolves with `{ kind: 'timeout' }` instead of rejecting.
 * Aborting `signal` stops the polling; a response already in flight is still
 * honoured.
 */
export async function pollOrderStatus<T>(
  orderId: string,
  decide: (data: OrderStatusData) => T | null,
  deps: Pick<PollOrderStatusDeps, 'currency'> & Partial<PollOrderStatusDeps>
): Promise<PollOrderStatusResult<T>> {
  const {
    getOrderStatus = defaultGetOrderStatus,
    sleep = (ms: number) =>
      new Promise<void>((resolve) => setTimeout(resolve, ms)),
    now = Date.now,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    signal,
    currency,
    intervalMs = defaultIntervalMs,
  } = deps;

  const startedAt = now();
  let clientErrors = 0;
  for (;;) {
    if (signal?.aborted) {
      return { kind: 'aborted' };
    }
    try {
      const { data } = await getOrderStatus({ orderId, currency });
      clientErrors = 0;
      const decision = decide(data);
      if (decision !== null) {
        return { kind: 'decided', decision };
      }
    } catch (error) {
      if (isClientError(error)) {
        clientErrors += 1;
        if (clientErrors >= MAX_CONSECUTIVE_CLIENT_ERRORS) {
          return { kind: 'unknown-order' };
        }
      }
    }
    const elapsed = now() - startedAt;
    if (elapsed >= timeoutMs) {
      return { kind: 'timeout' };
    }
    const interval = intervalMs(elapsed);
    await sleepUnlessAborted(
      sleep,
      Math.min(interval, timeoutMs - elapsed),
      signal
    );
  }
}

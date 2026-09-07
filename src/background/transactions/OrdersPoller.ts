import { createNanoEvents } from 'nanoevents';
import { RequestCache } from 'src/modules/request-cache/request-cache';
import type {
  OrderFill,
  OrderStatus,
} from 'src/modules/ethereum/transactions/types';
import {
  isTerminalOrderStatus,
  type Response as OrderStatusResponse,
} from 'src/modules/zerion-api/requests/transaction-get-order-status';

const FAST_INTERVAL_MS = 3_000;
const SLOW_INTERVAL_MS = 15_000;
const SLOW_AFTER_MS = 2 * 60 * 1000;
/** After this many consecutive 4xx the backend does not know the order */
const MAX_CONSECUTIVE_CLIENT_ERRORS = 5;

export interface PollingOrder {
  orderId: string;
  /** Placement time; drives the fast → slow backoff */
  timestamp: number;
}

interface Options {
  getOrderStatus: (orderId: string) => Promise<OrderStatusResponse>;
}

export interface OrderSettlement {
  status: OrderStatus;
  fills: OrderFill[];
}

function isClientError(error: unknown): boolean {
  const status = (error as { response?: { status?: number } } | null)?.response
    ?.status;
  return typeof status === 'number' && status >= 400 && status < 500;
}

/**
 * Polls `transaction/get-order-status/v1` for pending intent-swap Orders
 * (ADR-0004). Sibling of TransactionsPoller: lives in the background so the
 * Order settles even when the popup is closed.
 */
export class OrdersPoller {
  private map = new Map<string, PollingOrder>();
  private clientErrors = new Map<string, number>();
  private requestCache = new RequestCache();
  private timer: ReturnType<typeof setTimeout> | null = null;
  private requestInProgress = false;
  private options: Options | null = null;

  emitter = createNanoEvents<{
    'order:settled': (orderId: string, settlement: OrderSettlement) => void;
  }>();

  setOptions(options: Options) {
    this.options = options;
  }

  add(items: PollingOrder[]) {
    for (const item of items) {
      this.map.set(item.orderId, item);
    }
    if (this.map.size && !this.timer) {
      this.schedule(FAST_INTERVAL_MS);
    }
  }

  private schedule(ms: number) {
    this.timer = setTimeout(() => {
      this.timer = null;
      this.tick();
    }, ms);
  }

  private nextInterval() {
    const now = Date.now();
    let interval = SLOW_INTERVAL_MS;
    for (const item of this.map.values()) {
      if (now - item.timestamp < SLOW_AFTER_MS) {
        interval = FAST_INTERVAL_MS;
        break;
      }
    }
    return interval;
  }

  private settle(orderId: string, settlement: OrderSettlement) {
    this.map.delete(orderId);
    this.clientErrors.delete(orderId);
    this.emitter.emit('order:settled', orderId, settlement);
  }

  private async poll(item: PollingOrder) {
    if (!this.options) {
      return;
    }
    const { getOrderStatus } = this.options;
    const key = item.orderId;
    try {
      const response = await this.requestCache.get(
        key,
        () => getOrderStatus(item.orderId),
        { staleTime: 0, retryTime: 0 }
      );
      this.clientErrors.delete(key);
      const { status, fills } = response.data;
      if (isTerminalOrderStatus(status)) {
        this.settle(key, { status, fills: fills ?? [] });
      }
    } catch (error) {
      if (isClientError(error)) {
        const count = (this.clientErrors.get(key) ?? 0) + 1;
        this.clientErrors.set(key, count);
        if (count >= MAX_CONSECUTIVE_CLIENT_ERRORS) {
          this.settle(key, { status: 'failed', fills: [] });
        }
      } else {
        // Network / 5xx: tolerate and keep polling
        this.clientErrors.delete(key);
      }
    }
  }

  private async tick() {
    if (!this.options) {
      // eslint-disable-next-line no-console
      console.warn('OrdersPoller: options are not initialized');
      return;
    }
    if (this.requestInProgress) {
      return;
    }
    this.requestInProgress = true;
    await Promise.allSettled(
      Array.from(this.map.values()).map((item) => this.poll(item))
    );
    this.requestInProgress = false;
    if (this.map.size) {
      this.schedule(this.nextInterval());
    }
  }
}

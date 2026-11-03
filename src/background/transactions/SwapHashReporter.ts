import { HTTPError } from 'ky';
import type {
  ExecuteOrderPayload,
  Response as ExecuteOrderResponse,
} from 'src/modules/zerion-api/requests/transaction-execute-order';
import type { SignTransactionResult } from 'src/shared/types/SignTransactionResult';
import type { TransactionContextParams } from 'src/shared/types/SignatureContextParams';
import { retryWithBackoff } from 'src/shared/retryWithBackoff';
import { wait } from 'src/shared/wait';
import { emitter } from '../events';

export const HASH_REPORT_WAIT_MS = 5000;
export const REPORT_MEMORY_TTL_MS = 30 * 60 * 1000;
export const SWAP_REPORT_ATTEMPTS = 4;
export const SWAP_REPORT_BASE_DELAY_MS = 1000;
export const SIGN_REPORT_ATTEMPTS = 3;
export const SIGN_REPORT_RETRY_MS = 3000;

type ExecuteOrder = (
  payload: ExecuteOrderPayload
) => Promise<ExecuteOrderResponse>;

type TransactionSentContext = { mode: 'default' | 'testnet' } & Pick<
  TransactionContextParams,
  'orderReport'
>;

/** EVM hashes are case-insensitive hex and get lowercased; Solana base58 is case-sensitive */
export function toReportedHash(hash: string) {
  return hash.startsWith('0x') ? hash.toLowerCase() : hash;
}

function getSentHash(result: SignTransactionResult) {
  if (result.evm) {
    return result.evm.hash;
  }
  const solana = Array.isArray(result.solana)
    ? result.solana.at(0)
    : result.solana;
  return solana?.signature ?? null;
}

export function buildHashReportPayload({
  quoteId,
  swapHash,
  approveHash,
}: {
  quoteId: string;
  swapHash: string;
  approveHash?: string | null;
}): ExecuteOrderPayload {
  const payload: ExecuteOrderPayload = {
    quoteId,
    signatureSwap: toReportedHash(swapHash),
  };
  if (approveHash) {
    payload.signatureApprove = toReportedHash(approveHash);
  }
  return payload;
}

export async function reportWithRetry<T>(fn: () => Promise<T>): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt >= SIGN_REPORT_ATTEMPTS) {
        throw error;
      }
      await wait(SIGN_REPORT_RETRY_MS);
    }
  }
}

function retrySwapReport<T>(fn: () => Promise<T>) {
  return retryWithBackoff(fn, {
    attempts: SWAP_REPORT_ATTEMPTS,
    baseDelayMs: SWAP_REPORT_BASE_DELAY_MS,
  });
}

function describeError(error: unknown) {
  if (error instanceof HTTPError) {
    return `status ${error.response.status}`;
  }
  return error instanceof Error ? error.name : 'unknown error';
}

export class SwapHashReporter {
  private approveHashes = new Map<
    string,
    { hash: string; expiresAt: number }
  >();
  private reports = new Map<
    string,
    {
      orderId: Promise<string | null>;
      resolve: (orderId: Promise<string | null>) => void;
      expiresAt: number;
    }
  >();

  constructor(private executeOrder: ExecuteOrder) {}

  addListeners() {
    return emitter.on('transactionSent', (result, context) =>
      this.handleTransactionSent(result, context)
    );
  }

  handleTransactionSent(
    result: SignTransactionResult,
    { mode, orderReport }: TransactionSentContext
  ): Promise<string | null> | null {
    if (!orderReport || !orderReport.quoteId || mode === 'testnet') {
      return null;
    }
    const sentHash = getSentHash(result);
    if (!sentHash) {
      return null;
    }
    this.pruneExpired();
    const { quoteId, role } = orderReport;
    const hash = toReportedHash(sentHash);
    if (role === 'approve') {
      this.approveHashes.set(quoteId, {
        hash,
        expiresAt: Date.now() + REPORT_MEMORY_TTL_MS,
      });
      return null;
    } else if (role === 'swap') {
      const payload = buildHashReportPayload({
        quoteId,
        swapHash: hash,
        approveHash: this.approveHashes.get(quoteId)?.hash,
      });
      return this.trackReport(hash, retrySwapReport, payload);
    } else if (role === 'step') {
      return this.trackReport(hash, reportWithRetry, {
        quoteId,
        signatureSwap: hash,
      });
    }
    return null;
  }

  /** Resolves `null` if the report failed or none settles within {@link HASH_REPORT_WAIT_MS} */
  async getReportedOrderId(swapHash: string): Promise<string | null> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<null>((resolve) => {
      timer = setTimeout(() => resolve(null), HASH_REPORT_WAIT_MS);
    });
    const { orderId } = this.getReport(toReportedHash(swapHash));
    try {
      return await Promise.race([orderId, timeout]);
    } finally {
      clearTimeout(timer);
    }
  }

  private getReport(hash: string) {
    let report = this.reports.get(hash);
    if (!report) {
      let resolve: (orderId: Promise<string | null>) => void = () => {};
      const orderId = new Promise<string | null>((r) => {
        resolve = r;
      });
      report = {
        orderId,
        resolve,
        expiresAt: Date.now() + REPORT_MEMORY_TTL_MS,
      };
      this.reports.set(hash, report);
    }
    return report;
  }

  private trackReport(
    hash: string,
    retry: (
      fn: () => Promise<ExecuteOrderResponse>
    ) => Promise<ExecuteOrderResponse>,
    payload: ExecuteOrderPayload
  ) {
    const orderId = retry(() => this.executeOrder(payload)).then(
      (response) => response.data?.orderId ?? null,
      (error) => {
        // eslint-disable-next-line no-console
        console.error(
          `[SwapHashReporter] execute-order failed: quoteId=${
            payload.quoteId
          } hash=${hash.slice(0, 10)} ${describeError(error)}`
        );
        return null;
      }
    );
    this.getReport(hash).resolve(orderId);
    return orderId;
  }

  private pruneExpired() {
    const now = Date.now();
    for (const map of [this.approveHashes, this.reports]) {
      for (const [key, { expiresAt }] of map) {
        if (expiresAt <= now) {
          map.delete(key);
        }
      }
    }
  }
}

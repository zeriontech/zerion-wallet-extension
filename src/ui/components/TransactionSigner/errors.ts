import type { OrderStatus } from 'src/modules/ethereum/transactions/types';
import type { StepResult } from './types';

export class ReadonlyWalletError extends Error {
  name = 'ReadonlyWalletError';
  constructor(public address: string) {
    super(`Wallet ${address} is readonly and cannot sign transactions`);
  }
}

export class QueueError extends Error {
  name = 'QueueError';
  constructor(
    public failedAt: number,
    public completedResults: StepResult[],
    public cause: Error
  ) {
    super(`Queue failed at step ${failedAt}: ${cause.message}`);
  }
}

export class QueueAbortError extends Error {
  name = 'QueueAbortError';
  constructor(public abortedAt: number, public completedResults: StepResult[]) {
    super(`Queue aborted at step ${abortedAt}`);
  }
}

export class TransactionFailedOnChainError extends Error {
  name = 'TransactionFailedOnChainError';
  constructor(public status: 'failed' | 'dropped', public txHash: string) {
    super(`Transaction ${txHash} ${status} on-chain`);
  }
}

export type RequoteFailureReason =
  | 'provider-missing'
  | 'quote-error'
  | 'approve-required'
  | 'on-chain-quote'
  | 'stream-error'
  | 'timeout';

/** Re-quote after a mined approval did not yield a usable Intent Swap in time */
export class RequoteError extends Error {
  name = 'RequoteError';
  constructor(
    public kind: 'quote-refresh-timeout' | 'quote-refresh-failed',
    public reason: RequoteFailureReason | null
  ) {
    super(
      kind === 'quote-refresh-timeout'
        ? `Couldn't refresh the quote in time${reason ? ` (${reason})` : ''}`
        : `Couldn't refresh the quote${reason ? ` (${reason})` : ''}`
    );
  }
}

/** The Order settled as failed/rejected, or the backend does not know it */
export class OrderFailedError extends Error {
  name = 'OrderFailedError';
  constructor(public orderId: string, public orderStatus: OrderStatus) {
    super(`Order ${orderId} ${orderStatus}`);
  }
}

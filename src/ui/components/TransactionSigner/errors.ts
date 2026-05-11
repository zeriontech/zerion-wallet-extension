import type { SignTransactionResult } from 'src/shared/types/SignTransactionResult';

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
    public completedResults: SignTransactionResult[],
    public cause: Error
  ) {
    super(`Queue failed at step ${failedAt}: ${cause.message}`);
  }
}

export class QueueAbortError extends Error {
  name = 'QueueAbortError';
  constructor(
    public abortedAt: number,
    public completedResults: SignTransactionResult[]
  ) {
    super(`Queue aborted at step ${abortedAt}`);
  }
}

export class TransactionFailedOnChainError extends Error {
  name = 'TransactionFailedOnChainError';
  constructor(public status: 'failed' | 'dropped', public txHash: string) {
    super(`Transaction ${txHash} ${status} on-chain`);
  }
}

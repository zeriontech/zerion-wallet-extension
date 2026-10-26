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

/** The quote ran past its deadline before the Order was placed */
export class QuoteExpiredError extends Error {
  name = 'QuoteExpiredError';
  constructor() {
    super('The quote expired before the order was placed. Try again.');
  }
}

/** A typed-data document of the quote failed validation; nothing was signed */
export class IntentVerificationError extends Error {
  name = 'IntentVerificationError';
  constructor(public problems: string[]) {
    super("We couldn't verify this quote");
  }
}

/** A typed-data signature did not recover to the wallet the user is acting for; nothing was placed */
export class IntentSignerMismatchError extends Error {
  name = 'IntentSignerMismatchError';
  constructor(public address: string, public recovered: string | null) {
    super("The signature doesn't match your wallet. Nothing was submitted.");
  }
}

/** execute-order rejected the signed Order for a reason other than an expired quote */
export class OrderPlacementError extends Error {
  name = 'OrderPlacementError';
  constructor(public status: number | null) {
    super("Couldn't place the order. Try again.");
  }
}

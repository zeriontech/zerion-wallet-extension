import type { SignTransactionResult } from 'src/shared/types/SignTransactionResult';
import { isReadonlyContainer } from 'src/shared/types/validators';
import { getWalletGroupByAddress } from 'src/ui/shared/requests/getWalletGroupByAddress';
import { ReadonlyWalletError } from './errors';
import { appendQueue } from './store';
import type { SignStep, SignTransactionsOptions } from './types';

export interface SignTransactionsResult {
  queueId: string;
  promise: Promise<SignTransactionResult[]>;
}

/**
 * Imperative entry point. Always returns synchronously with a queueId and a
 * promise; pre-flight rejections (readonly) surface through the promise
 * without the queue ever entering the global line.
 */
export function signTransactions(
  steps: SignStep[],
  options: SignTransactionsOptions
): SignTransactionsResult {
  if (steps.length === 0) {
    return {
      queueId: '',
      promise: Promise.resolve([]),
    };
  }

  // Synchronously enqueue so callers receive a stable queueId; the readonly
  // pre-flight runs inside the runner before any step executes, and rejects
  // the promise + removes the queue if the wallet is readonly.
  const enqueued = appendQueue(steps, options);
  return enqueued;
}

export async function isReadonlyWallet(address: string): Promise<boolean> {
  const group = await getWalletGroupByAddress(address);
  if (!group) return false;
  return isReadonlyContainer(group.walletContainer);
}

export { ReadonlyWalletError };

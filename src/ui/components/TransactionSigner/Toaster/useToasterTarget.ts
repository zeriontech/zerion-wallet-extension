import { useMemo } from 'react';
import { useStore } from '@store-unit/react';
import type { TransactionObject } from 'src/modules/ethereum/transactions/types';
import { getExplorerUrl } from 'src/modules/ethereum/transactions/addressAction';
import { localTransactionsStore } from 'src/ui/transactions/transactions-store';
import type { ActiveStepView } from './useToasterSession';

export interface ToasterTarget {
  /** Hash to copy, null while the step has no on-chain identifier yet */
  hash: string | null;
  /** Where "view in explorer" points, null when there's nothing to link to */
  explorerUrl: string | null;
}

const EMPTY: ToasterTarget = { hash: null, explorerUrl: null };

function matches(tx: TransactionObject, hash: string): boolean {
  return tx.hash === hash || tx.signature === hash;
}

/**
 * Resolves the copy/explorer target for the step the toaster is showing.
 *
 * The hash arrives with the step's broadcast event. The explorer link prefers
 * the template the step was enqueued with and falls back to the URL stored on
 * the local transaction's address action (the chain explorer).
 */
export function useToasterTarget(step: ActiveStepView | null): ToasterTarget {
  const localTransactions = useStore(localTransactionsStore);
  return useMemo(() => {
    if (!step?.hash) return EMPTY;
    const { hash } = step;
    const explorerUrl =
      getExplorerUrl(step.toaster?.explorerUrlTemplate ?? null, hash) ??
      localTransactions.find((tx) => matches(tx, hash))?.addressAction
        ?.transaction?.explorerUrl ??
      null;
    return { hash, explorerUrl };
  }, [step, localTransactions]);
}

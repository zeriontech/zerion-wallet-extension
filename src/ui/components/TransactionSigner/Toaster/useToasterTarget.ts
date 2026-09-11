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

function matches(tx: TransactionObject, step: ActiveStepView): boolean {
  if (step.orderId) return tx.orderId === step.orderId;
  if (step.hash) return tx.hash === step.hash || tx.signature === step.hash;
  return false;
}

/**
 * Resolves the copy/explorer target for the step the toaster is showing.
 *
 * A `send` step knows its hash from the broadcast event. An `order` step only
 * knows the Order id — its fill hash lands in the local transactions mirror
 * when the Order settles, which is also what ends the step, so by the time the
 * success state renders the hash is there.
 */
export function useToasterTarget(step: ActiveStepView | null): ToasterTarget {
  const localTransactions = useStore(localTransactionsStore);
  return useMemo(() => {
    if (!step || (!step.hash && !step.orderId)) return EMPTY;
    const entry = localTransactions.find((tx) => matches(tx, step));
    const hash = step.hash ?? entry?.hash ?? entry?.fills?.[0]?.hash ?? null;
    const explorerUrl =
      getExplorerUrl(step.toaster?.explorerUrlTemplate ?? null, hash) ??
      // Falls back to the URL the address action was built with (the chain
      // explorer), for steps that carry no template of their own.
      entry?.addressAction?.transaction?.explorerUrl ??
      null;
    return { hash, explorerUrl };
  }, [step, localTransactions]);
}

import { useStore } from '@store-unit/react';
import { useMemo } from 'react';
import { getTransactionObjectStatus } from 'src/modules/ethereum/transactions/getTransactionObjectStatus';
import type { ActionStatus } from 'src/modules/zerion-api/requests/wallet-get-actions';
import type { TransactionObject } from 'src/modules/ethereum/transactions/types';
import { localTransactionsStore } from './transactions-store';

function matchesId(tx: TransactionObject, id: string) {
  return tx.hash === id || tx.signature === id || tx.orderId === id;
}

export function useTransactionStatus(hash: string | null) {
  const transactions = useStore(localTransactionsStore);
  return useMemo(() => {
    if (hash) {
      const tx = transactions.find((tx) => matchesId(tx, hash));
      return tx ? getTransactionObjectStatus(tx) : null;
    } else {
      return null;
    }
  }, [hash, transactions]);
}

export function waitForTransactionResolve(
  hash: string | null
): Promise<ActionStatus> {
  if (!hash) {
    return Promise.reject(
      new Error('Hash is required to wait for transaction resolve')
    );
  }
  return new Promise((resolve) => {
    const unsub = localTransactionsStore.on('change', (transactions) => {
      const tx = transactions.find((tx) => matchesId(tx, hash));
      if (tx) {
        const status = getTransactionObjectStatus(tx);
        if (status !== 'pending') {
          resolve(status);
          unsub();
          return;
        }
      }
    });
  });
}

export type OrderWaitResult = 'confirmed' | 'failed' | 'timeout';

/**
 * Resolves when the Order leaves `pending` in the local store mirror, or with
 * `'timeout'` after {timeoutMs}. The background keeps polling either way.
 */
export function waitForOrderResolve(
  orderId: string,
  timeoutMs: number
): Promise<OrderWaitResult> {
  const toResult = (tx: TransactionObject): OrderWaitResult | null => {
    const status = getTransactionObjectStatus(tx);
    if (status === 'confirmed') return 'confirmed';
    if (status === 'failed' || status === 'dropped') return 'failed';
    return null;
  };
  return new Promise((resolve) => {
    let unsub: (() => void) | null = null;
    const timer = setTimeout(() => {
      unsub?.();
      resolve('timeout');
    }, timeoutMs);
    const check = (transactions: TransactionObject[]) => {
      const tx = transactions.find((tx) => tx.orderId === orderId);
      const result = tx ? toResult(tx) : null;
      if (result) {
        clearTimeout(timer);
        unsub?.();
        resolve(result);
        return true;
      }
      return false;
    };
    if (check(localTransactionsStore.getState())) {
      return;
    }
    unsub = localTransactionsStore.on('change', check);
  });
}

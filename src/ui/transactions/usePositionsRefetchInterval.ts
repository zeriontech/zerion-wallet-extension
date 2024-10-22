import { useStore } from '@store-unit/react';
import { useEffect, useState } from 'react';
import { Store } from 'store-unit';
import { localTransactionsStore } from './transactions-store';

const latestTxTimeStore = new Store(0);

localTransactionsStore.on('change', (state) => {
  const knownLatest = latestTxTimeStore.getState();
  // in localTransactionsStore transactions are sorted reverse-chronologically
  // so the newest item is the first item
  const latestTx = state.at(0);
  if (latestTx) {
    if (latestTx.timestamp > knownLatest) {
      latestTxTimeStore.setState(latestTx.timestamp);
    }
  }
});

function useNow() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

const TWO_MINUTES = 1000 * 60 * 2;
const URGENT_REFETCH_INTERVAl = 4000; // 4 seconds

/**
 * This hook returns a small refetchInterval value
 * within two minutes of a last known submitted transaction
 * {false} is a valid value for react query which means no refetch interval
 */
export function usePositionsRefetchInterval(fallback: number | false) {
  const latest = useStore(latestTxTimeStore);
  const now = useNow();
  if (!latest) {
    return fallback;
  }

  if (now - latest < TWO_MINUTES) {
    return URGENT_REFETCH_INTERVAl;
  } else {
    return fallback;
  }
}

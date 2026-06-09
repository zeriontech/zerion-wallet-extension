import { useStore } from '@store-unit/react';
import { useEffect, useState } from 'react';
import { Store } from 'store-unit';

const latestOpStore = new Store(0);

export function markHyperliquidOpSubmitted() {
  latestOpStore.setState(Date.now());
}

const BURST_WINDOW = 1000 * 6;
const BURST_INTERVAL = 2000;

function useNow(enabled: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (enabled) {
      const id = setInterval(() => {
        setNow(Date.now());
      }, BURST_INTERVAL);
      return () => clearInterval(id);
    }
  }, [enabled]);
  return now;
}

let handledTimestamp: number | null = null;

/**
 * Returns a 2s refetchInterval for 6s after the most recent Hyperliquid
 * operation (deposit/withdraw/trade), then falls back. Driven purely by
 * HL-API success signals via `markHyperliquidOpSubmitted()` — not wired
 * into `localTransactionsStore`.
 */
export function useHyperliquidRefetchInterval(fallback: number | false) {
  const latest = useStore(latestOpStore);
  const nowEnabled = Boolean(latest && latest !== handledTimestamp);
  const now = useNow(nowEnabled);
  if (!latest) {
    return fallback;
  }
  if (now - latest < BURST_WINDOW) {
    return BURST_INTERVAL;
  }
  handledTimestamp = latest;
  return fallback;
}

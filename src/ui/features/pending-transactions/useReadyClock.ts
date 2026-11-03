import { useEffect, useState } from 'react';
import type { PendingAction } from 'src/modules/zerion-api/requests/wallet-get-actions';
import { armReadyClock, watchReadyClock } from './readyClock';

export function useReadyClock(unsigned: PendingAction[]): number {
  const [nowMs, setNowMs] = useState(Date.now);
  useEffect(() => watchReadyClock(unsigned, setNowMs), [unsigned]);
  useEffect(
    () => armReadyClock(unsigned, nowMs, () => setNowMs(Date.now())),
    [unsigned, nowMs]
  );
  return nowMs;
}

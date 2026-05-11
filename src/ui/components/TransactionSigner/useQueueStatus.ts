import { useEffect, useState } from 'react';
import { getQueueStatus, subscribeChange } from './store';
import type { QueueStatus } from './types';

export function useQueueStatus(queueId: string | null): QueueStatus | null {
  const [status, setStatus] = useState<QueueStatus | null>(() =>
    queueId ? getQueueStatus(queueId) : null
  );

  useEffect(() => {
    if (!queueId) {
      setStatus(null);
      return;
    }
    setStatus(getQueueStatus(queueId));
    return subscribeChange(() => {
      setStatus(getQueueStatus(queueId));
    });
  }, [queueId]);

  return status;
}

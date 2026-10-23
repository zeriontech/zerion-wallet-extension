import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import type { PendingAction } from 'src/modules/zerion-api/requests/wallet-get-actions';
import { getPendingStatus } from './getPendingStatus';

dayjs.extend(relativeTime);

export function getPendingStatusLabel(
  item: PendingAction,
  nowMs: number
): string {
  const status = getPendingStatus(item, nowMs);
  switch (status.kind) {
    case 'readyToSign':
      return 'Ready to sign';
    case 'readyIn':
      return `Ready to sign ${dayjs(status.readyAt).from(nowMs)}`;
    case 'notReadyYet':
      return 'Not ready yet';
    case 'inProgress':
    case 'broadcasted':
      return 'Pending';
  }
}

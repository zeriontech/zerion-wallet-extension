import type { PendingAction } from 'src/modules/zerion-api/requests/wallet-get-actions';

export const PENDING_STATUS_KINDS = [
  'inProgress',
  'broadcasted',
  'readyIn',
  'notReadyYet',
  'readyToSign',
] as const;

export type PendingStatusKind = (typeof PENDING_STATUS_KINDS)[number];

export type PendingStatus =
  | { kind: 'inProgress' }
  | { kind: 'broadcasted'; hash: string }
  | { kind: 'readyIn'; readyAt: number }
  | { kind: 'notReadyYet' }
  | { kind: 'readyToSign' };

export function getPendingStatus(
  item: PendingAction,
  nowMs: number
): PendingStatus {
  switch (item.status) {
    case 'pending': {
      const hash = item.acts.find((act) => act.transaction.hash !== '')
        ?.transaction.hash;
      return hash ? { kind: 'broadcasted', hash } : { kind: 'inProgress' };
    }
    case 'unsigned': {
      if (item.availableAt === null) {
        return { kind: 'notReadyYet' };
      }
      return item.availableAt > nowMs
        ? { kind: 'readyIn', readyAt: item.availableAt }
        : { kind: 'readyToSign' };
    }
  }
}

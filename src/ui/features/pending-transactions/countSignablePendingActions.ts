import type { PendingAction } from 'src/modules/zerion-api/requests/wallet-get-actions';

export function countSignablePendingActions(
  unsigned: PendingAction[],
  nowMs: number
): number {
  return unsigned.filter(
    (item) =>
      item.status === 'unsigned' &&
      item.availableAt !== null &&
      item.availableAt <= nowMs
  ).length;
}

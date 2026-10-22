import type {
  ActionChain,
  PendingAct,
  PendingAction,
  PendingActionStatus,
  PendingActionWire,
  PendingActWire,
  Response,
  WalletActionsWireResponse,
} from './wallet-get-actions';

export const PENDING_ACTION_STATUSES = ['pending', 'unsigned'] as const;

const NO_CHAIN: ActionChain = { id: '', name: '', iconUrl: null };

function normalizeActs(acts: PendingActWire[]): PendingAct[] {
  const chain =
    acts.find((act) => act.transaction != null)?.transaction?.chain ?? NO_CHAIN;
  return acts.map((act) => ({
    ...act,
    status: act.status ?? '',
    transaction: act.transaction
      ? { ...act.transaction, hash: act.transaction.hash ?? '' }
      : { chain, hash: '', explorerUrl: null },
  }));
}

function secondsToMs(seconds: number | null | undefined) {
  return seconds == null ? null : seconds * 1000;
}

function isUnsettledFor(
  status: PendingActionWire['status'],
  list: PendingActionStatus
) {
  return (
    status === undefined || status === null || status === '' || status === list
  );
}

export function normalizePendingList(
  rows: PendingActionWire[] | null | undefined,
  list: PendingActionStatus
): PendingAction[] {
  const result: PendingAction[] = [];
  for (const row of rows ?? []) {
    const { id } = row;
    if (
      typeof id === 'string' &&
      id !== '' &&
      isUnsettledFor(row.status, list)
    ) {
      if (!Array.isArray(row.acts)) {
        // eslint-disable-next-line no-console
        console.warn(`Pending action ${id} has no acts array, dropped`);
        continue;
      }
      result.push({
        ...row,
        status: list,
        pendingActionId: id,
        acts: normalizeActs(row.acts),
        timestamp: row.timestamp * 1000,
        availableAt: secondsToMs(row.availableAt),
        expiresAt: secondsToMs(row.expiresAt),
      });
    }
  }
  return result;
}

export function normalizePendingLists(
  wire: Pick<WalletActionsWireResponse, 'pending' | 'unsigned'>
): Pick<Response, 'pending' | 'unsigned' | 'pendingListsAvailable'> {
  return {
    pending: normalizePendingList(wire.pending, 'pending'),
    unsigned: normalizePendingList(wire.unsigned, 'unsigned'),
    pendingListsAvailable:
      Array.isArray(wire.pending) && Array.isArray(wire.unsigned),
  };
}

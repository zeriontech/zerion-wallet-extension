import type {
  ActionType,
  AddressAction,
  PendingAction,
} from 'src/modules/zerion-api/requests/wallet-get-actions';
import {
  getLocalPendingActions,
  type LocalHistoryRow,
} from 'src/ui/features/pending-transactions/getLocalPendingActions';
import {
  getRowTransactions,
  matchesSearchQuery,
  mergePendingEntries,
  type PendingListEntry,
} from 'src/ui/features/pending-transactions/mergePendingEntries';

export type PendingRowFilters = {
  chain?: string;
  searchQuery?: string;
  actionTypes?: ActionType[];
};

/** History's chain, search and action-type filters, applied to the backend pending rows the way they apply to local rows. */
export function filterPendingRows(
  rows: PendingAction[],
  { chain, searchQuery, actionTypes }: PendingRowFilters,
  hiddenIds: ReadonlySet<string>
): PendingAction[] {
  return rows.filter(
    (row) =>
      !hiddenIds.has(row.pendingActionId) &&
      (!chain ||
        getRowTransactions(row).some(
          (transaction) => transaction.chain.id === chain
        )) &&
      (!searchQuery || matchesSearchQuery(searchQuery, row)) &&
      (!actionTypes?.length ||
        actionTypes.includes(row.type.value) ||
        row.acts.some((act) => actionTypes.includes(act.type.value)))
  );
}

function sortByTimestampDesc<T extends { timestamp: number }>(rows: T[]) {
  return rows.sort((a, b) => b.timestamp - a.timestamp);
}

/** Splits History into the Pending group (unsigned, then backend and local pending by time) and the date-grouped rows. */
export function mergeHistoryActions<L extends LocalHistoryRow>({
  local,
  actions,
  pending,
  unsigned,
  hiddenIds,
  filters,
  contentFiltered,
}: {
  local: L[];
  actions: AddressAction[] | undefined;
  pending: PendingAction[];
  unsigned: PendingAction[];
  hiddenIds: ReadonlySet<string>;
  filters: PendingRowFilters;
  contentFiltered: boolean;
}): { pending: PendingListEntry<L>[]; history: (L | AddressAction)[] } {
  const keptLocal = getLocalPendingActions({
    localActions: local,
    actions,
    pending,
    unsigned,
    contentFiltered,
  });
  const pendingEntries = mergePendingEntries({
    local: keptLocal.filter((action) => action.status === 'pending'),
    pending: filterPendingRows(pending, filters, hiddenIds),
    unsigned: filterPendingRows(unsigned, filters, hiddenIds),
    actions,
  });
  const history = sortByTimestampDesc<L | AddressAction>([
    ...keptLocal.filter((action) => action.status !== 'pending'),
    ...(actions ?? []),
  ]);
  return { pending: pendingEntries, history };
}

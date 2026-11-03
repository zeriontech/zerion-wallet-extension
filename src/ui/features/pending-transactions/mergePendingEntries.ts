import type { PendingAction } from 'src/modules/zerion-api/requests/wallet-get-actions';

export type RowTransaction = {
  hash?: string | null;
  chain: { id: string };
  sender?: string | null;
  nonce?: number | null;
};

/** The shape every History row shares: a local action may have no acts and an act may have lost its transaction. */
export type MergeRow = {
  acts?: ReadonlyArray<{ transaction?: RowTransaction | null }> | null;
  transaction?: RowTransaction | null;
};

export type LocalRow = MergeRow & { id: string; timestamp: number };

export type PendingListEntry<L extends LocalRow = LocalRow> =
  | { kind: 'local'; action: L }
  | { kind: 'remote'; item: PendingAction };

function isSameOnChainId(
  a: string | null | undefined,
  b: string | null | undefined
): boolean {
  if (!a || !b) {
    return false;
  }
  if (a.startsWith('0x') && b.startsWith('0x')) {
    return a.toLowerCase() === b.toLowerCase();
  }
  return a === b;
}

export const isSameTxHash = isSameOnChainId;

export function matchesSearchQuery(
  searchQuery: string,
  value: unknown
): boolean {
  const words = searchQuery.toLowerCase().split(/\s+/);
  const valueString = JSON.stringify(value).toLowerCase();
  return words.every((word) => valueString.includes(word));
}

export function getEntryKey(entry: PendingListEntry): string {
  return entry.kind === 'local'
    ? `local:${entry.action.id}`
    : `remote:${entry.item.pendingActionId}`;
}

function getEntryTimestamp(entry: PendingListEntry) {
  return entry.kind === 'local' ? entry.action.timestamp : entry.item.timestamp;
}

const KIND_RANK: Record<PendingListEntry['kind'], number> = {
  remote: 0,
  local: 1,
};

function compareEntries(a: PendingListEntry, b: PendingListEntry) {
  const keyA = getEntryKey(a);
  const keyB = getEntryKey(b);
  return (
    getEntryTimestamp(b) - getEntryTimestamp(a) ||
    KIND_RANK[a.kind] - KIND_RANK[b.kind] ||
    (keyA < keyB ? -1 : keyA > keyB ? 1 : 0)
  );
}

export function getRowTransactions(row: MergeRow): RowTransaction[] {
  const transactions: RowTransaction[] = [];
  for (const act of row.acts ?? []) {
    if (act?.transaction) {
      transactions.push(act.transaction);
    }
  }
  if (row.transaction) {
    transactions.push(row.transaction);
  }
  return transactions;
}

function getHashes(rows: MergeRow[]) {
  return rows.flatMap((row) =>
    getRowTransactions(row).map((transaction) => transaction.hash)
  );
}

function carriesAnyHash(row: MergeRow, hashes: (string | null | undefined)[]) {
  return getRowTransactions(row).some((transaction) =>
    hashes.some((hash) => isSameTxHash(transaction.hash, hash))
  );
}

const isSameSender = isSameOnChainId;

function consumesNonce(local: RowTransaction, indexed: RowTransaction) {
  return (
    local.nonce != null &&
    indexed.nonce != null &&
    indexed.chain.id === local.chain.id &&
    isSameSender(indexed.sender, local.sender) &&
    indexed.nonce >= local.nonce
  );
}

function isNonceSuperseded(local: MergeRow, actions: MergeRow[]) {
  return getRowTransactions(local).some((localTransaction) =>
    actions.some((indexed) =>
      getRowTransactions(indexed).some((indexedTransaction) =>
        consumesNonce(localTransaction, indexedTransaction)
      )
    )
  );
}

/** A local action leaves Pending once the backend has its hash, or a mined transaction on its chain from its sender used its nonce or a later one (WLT-2951, WLT-3067). */
export function isSupersededLocalAction(
  local: MergeRow,
  {
    actions,
    pending,
    unsigned,
  }: { actions: MergeRow[]; pending: MergeRow[]; unsigned: MergeRow[] }
): boolean {
  return (
    carriesAnyHash(local, getHashes([...actions, ...pending, ...unsigned])) ||
    isNonceSuperseded(local, actions)
  );
}

function isExcludedBySearch(action: LocalRow, searchQuery: string | undefined) {
  return searchQuery ? !matchesSearchQuery(searchQuery, action) : false;
}

export function mergePendingEntries<L extends LocalRow>({
  local,
  pending,
  unsigned,
  searchQuery,
  actions,
}: {
  local: L[];
  pending: PendingAction[];
  unsigned: PendingAction[];
  searchQuery?: string;
  /** The loaded actions the date groups render: a row carrying one of their hashes is not pending any more. */
  actions: MergeRow[] | undefined;
}): PendingListEntry<L>[] {
  const loadedHashes = getHashes(actions ?? []);
  const isNotLoaded = (row: MergeRow) => !carriesAnyHash(row, loadedHashes);
  const visibleLocal = local.filter(
    (action) =>
      !isSupersededLocalAction(action, {
        actions: actions ?? [],
        pending,
        unsigned,
      }) && !isExcludedBySearch(action, searchQuery)
  );
  const toRemoteEntry = (item: PendingAction): PendingListEntry<L> => ({
    kind: 'remote',
    item,
  });
  const toLocalEntry = (action: L): PendingListEntry<L> => ({
    kind: 'local',
    action,
  });
  return [
    ...unsigned.filter(isNotLoaded).map(toRemoteEntry).sort(compareEntries),
    ...[
      ...pending.filter(isNotLoaded).map(toRemoteEntry),
      ...visibleLocal.map(toLocalEntry),
    ].sort(compareEntries),
  ];
}

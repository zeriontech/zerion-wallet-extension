import type { InfiniteData } from '@tanstack/react-query';
import type {
  AddressAction,
  PendingAction,
  Payload as WalletActionsPayload,
  Response as WalletActionsResponse,
} from 'src/modules/zerion-api/requests/wallet-get-actions';
import {
  getRowTransactions,
  isSupersededLocalAction,
  type LocalRow,
  type MergeRow,
} from './mergePendingEntries';

export type LocalHistoryRow = Omit<LocalRow, 'acts'> & {
  status: AddressAction['status'];
  content?: AddressAction['content'];
  acts?: ReadonlyArray<{
    transaction?: LocalRow['transaction'];
    content?: AddressAction['content'];
  }> | null;
};

function hasKnownIdentity(action: MergeRow) {
  return getRowTransactions(action).some(
    (transaction) => transaction.sender != null && transaction.nonce != null
  );
}

function hasFungibleContent(content: AddressAction['content'] | undefined) {
  return Boolean(
    content?.transfers?.some((transfer) => transfer.fungible) ||
      content?.approvals?.some((approval) => approval.fungible)
  );
}

/** The `assetTypes` filter for local rows: `nft` keeps none, `fungible` keeps a row with a fungible transfer or approval in any act (WLT-1724). */
export function filterLocalByAssetTypes<T extends LocalHistoryRow>(
  actions: T[],
  assetTypes: ('fungible' | 'nft')[] | undefined
): T[] {
  if (assetTypes?.length !== 1) {
    return actions;
  }
  if (assetTypes[0] === 'nft') {
    return [];
  }
  return actions.filter((action) =>
    [action.content, ...(action.acts?.map((act) => act.content) ?? [])].some(
      hasFungibleContent
    )
  );
}

/** The local actions History keeps: those the loaded backend lists do not supersede; a still-pending row is never hidden by age (WLT-1724). */
export function getLocalPendingActions<T extends LocalHistoryRow>({
  localActions,
  actions,
  pending,
  unsigned,
  contentFiltered,
}: {
  localActions: T[];
  actions: (MergeRow & { timestamp: number })[] | undefined;
  pending: PendingAction[];
  unsigned: PendingAction[];
  /** A type, asset or search filter can leave the superseding action out of `actions`, so only rows newer than the loaded history stay. */
  contentFiltered: boolean;
}): T[] {
  if (!actions) {
    return [];
  }
  const newestLoadedMs = actions.at(0)?.timestamp || 0;
  const needsTimestampRule = (action: T) =>
    action.status !== 'pending' &&
    (contentFiltered || !hasKnownIdentity(action));
  return localActions.filter(
    (action) =>
      (!needsTimestampRule(action) || newestLoadedMs < action.timestamp) &&
      !isSupersededLocalAction(action, { actions, pending, unsigned })
  );
}

export function hasContentFilter(params: WalletActionsPayload): boolean {
  return Boolean(
    params.actionTypes?.length ||
      params.assetTypes?.length ||
      params.fungibleId ||
      params.searchQuery
  );
}

/** The local rows in Pending for a get-actions request, as its poll gating sees them. */
export function getRequestLocalPending<T extends LocalHistoryRow>(
  params: WalletActionsPayload,
  localActions: T[],
  data: InfiniteData<WalletActionsResponse> | undefined
): T[] {
  const { chain } = params;
  return getLocalPendingActions({
    localActions: chain
      ? localActions.filter((action) =>
          getRowTransactions(action).some(
            (transaction) => transaction.chain.id === chain
          )
        )
      : localActions,
    actions: data?.pages.flatMap((page) => page.data),
    pending: data?.pages[0]?.pending ?? [],
    unsigned: data?.pages[0]?.unsigned ?? [],
    contentFiltered: hasContentFilter(params),
  });
}

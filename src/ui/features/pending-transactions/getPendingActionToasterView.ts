import type {
  PendingAction,
  Transfer,
} from 'src/modules/zerion-api/requests/wallet-get-actions';
import type { ToasterView } from 'src/ui/components/TransactionSigner/types';

function toToasterAsset(transfer: Transfer) {
  return {
    symbol:
      transfer.fungible?.symbol ?? transfer.nft?.metadata?.name ?? 'Token',
    iconUrl:
      transfer.fungible?.iconUrl ??
      transfer.nft?.metadata?.content?.imagePreviewUrl ??
      null,
  };
}

/** The transaction toaster's view of a pending row, from its own transfers and approvals. */
export function getPendingActionToasterView(
  item: PendingAction
): ToasterView | undefined {
  const transfers = item.content?.transfers ?? [];
  const sent = transfers.find((transfer) => transfer.direction === 'out');
  const received = transfers.find((transfer) => transfer.direction === 'in');
  const firstChain =
    item.acts.at(0)?.transaction.chain ?? item.transaction?.chain;
  const lastChain = item.acts.at(-1)?.transaction.chain ?? firstChain;
  if (sent && received) {
    return {
      kind: firstChain?.id === lastChain?.id ? 'swap' : 'bridge',
      sent: toToasterAsset(sent),
      received: toToasterAsset(received),
      receivedChain: { iconUrl: lastChain?.iconUrl ?? null },
    };
  }
  const approval = item.content?.approvals?.at(0);
  if (approval && !sent) {
    return {
      kind: 'approve',
      token: {
        symbol: approval.fungible?.symbol ?? approval.collection?.name ?? '',
        iconUrl:
          approval.fungible?.iconUrl ?? approval.collection?.iconUrl ?? null,
      },
      chain: { iconUrl: firstChain?.iconUrl ?? null },
    };
  }
  if (sent) {
    return {
      kind: 'send',
      token: toToasterAsset(sent),
      chain: { iconUrl: firstChain?.iconUrl ?? null },
      recipient: { address: item.label?.wallet?.address ?? '' },
      isNft: Boolean(sent.nft),
    };
  }
  return undefined;
}

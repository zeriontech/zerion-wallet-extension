import { isTruthy } from 'is-truthy-ts';
import type { LocalAddressAction } from 'src/modules/ethereum/transactions/addressAction';
import type {
  Collection,
  FungibleOutline,
  NFTPreview,
} from 'src/modules/zerion-api/requests/wallet-get-actions';

function fungibleMatches(query: string, fungible: FungibleOutline | null) {
  if (!fungible) {
    return false;
  }
  return [fungible.name, fungible.symbol, fungible.id]
    .filter(isTruthy)
    .map((s) => s.toLowerCase())
    .some((s) => s.includes(query));
}

function nftMatches(query: string, nft: NFTPreview | null) {
  if (!nft) {
    return false;
  }
  return [nft.metadata?.name, nft.contractAddress, nft.tokenId]
    .filter(isTruthy)
    .map((s) => s.toLowerCase())
    .some((s) => s.includes(query));
}

function collectionMatches(query: string, collection: Collection | null) {
  if (!collection) {
    return false;
  }
  return [collection.name, collection.id]
    .filter(isTruthy)
    .map((s) => s.toLowerCase())
    .some((s) => s.includes(query));
}

function isMatchForQuery(query: string, action: LocalAddressAction) {
  if (
    action.type.displayValue.toLowerCase().includes(query) ||
    action.type.value.toLowerCase().includes(query)
  ) {
    return true;
  }
  if (action.status.includes(query)) {
    return true;
  }

  if (
    action.label?.contract?.address.includes(query) ||
    action.label?.wallet?.address.includes(query)
  ) {
    return true;
  }

  if (
    action.content?.transfers?.some(
      (transfer) =>
        fungibleMatches(query, transfer.fungible) ||
        nftMatches(query, transfer.nft)
    )
  ) {
    return true;
  }

  if (
    action.content?.approvals?.some(
      (transfer) =>
        fungibleMatches(query, transfer.fungible) ||
        nftMatches(query, transfer.nft) ||
        collectionMatches(query, transfer.collection)
    )
  ) {
    return true;
  }

  return false;
}

export function isMatchForAllWords(query: string, action: LocalAddressAction) {
  const words = query.trim().split(/\s+/);
  return words.every((word) => isMatchForQuery(word, action));
}

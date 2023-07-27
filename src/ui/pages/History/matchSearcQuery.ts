import { isTruthy } from 'is-truthy-ts';
import {
  getFungibleAsset,
  getNftAsset,
} from 'src/modules/ethereum/transactions/actionAsset';
import type { LocalAddressAction } from 'src/modules/ethereum/transactions/addressAction';

interface Asset {
  asset_code: string;
  name: string | null;
  symbol: string;
}

function assetMatches(
  query: string,
  asset?: Asset | Record<string, never> | null
) {
  if (!asset || !('asset_code' in asset)) {
    return false;
  }
  return [asset.name, asset.symbol, asset.asset_code]
    .filter(isTruthy)
    .map((s) => s.toLowerCase())
    .some((s) => s.includes(query));
}

function isMatchForQuery(query: string, action: LocalAddressAction) {
  if (
    action.type.display_value.toLowerCase().includes(query) ||
    action.type.value.toLowerCase().includes(query)
  ) {
    return true;
  }
  if (action.transaction.status.includes(query)) {
    return true;
  }

  if (
    action.label?.display_value.contract_address?.includes(query) ||
    action.label?.display_value.wallet_address?.includes(query)
  ) {
    return true;
  }

  if (
    assetMatches(query, getFungibleAsset(action.content?.single_asset?.asset))
  ) {
    return true;
  }

  if (
    action.content?.transfers?.incoming?.some(
      (transfer) =>
        assetMatches(query, getFungibleAsset(transfer.asset)) ||
        assetMatches(query, getNftAsset(transfer.asset))
    )
  ) {
    return true;
  }

  if (
    action.content?.transfers?.outgoing?.some(
      (transfer) =>
        assetMatches(query, getFungibleAsset(transfer.asset)) ||
        assetMatches(query, getNftAsset(transfer.asset))
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

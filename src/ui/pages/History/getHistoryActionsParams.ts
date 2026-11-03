import type {
  ActionType,
  Payload,
} from 'src/modules/zerion-api/requests/wallet-get-actions';
import { getAddressActionsCursor } from './getAddressActionCursor';

export const HISTORY_PAGE_LIMIT = 10;

/** Pending lists are requested only for an own wallet and never with a date jump (product decision Q8). */
export function getHistoryActionsParams({
  address,
  currency,
  chain,
  searchQuery,
  startDate,
  actionTypes,
  assetTypes,
  isOwnWallet,
}: {
  address: string;
  currency: string;
  chain?: string;
  searchQuery?: string;
  startDate?: string;
  actionTypes?: ActionType[];
  assetTypes?: ('fungible' | 'nft')[];
  isOwnWallet: boolean;
}): Payload {
  return {
    addresses: [address],
    currency,
    chain,
    searchQuery: searchQuery || undefined,
    cursor: startDate ? getAddressActionsCursor(startDate) : undefined,
    actionTypes: actionTypes?.length ? actionTypes : undefined,
    assetTypes: assetTypes?.length ? assetTypes : undefined,
    limit: HISTORY_PAGE_LIMIT,
    includePending: isOwnWallet && !startDate ? true : undefined,
  };
}

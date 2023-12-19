import { createDomainHook } from 'defi-sdk';
import type { AddressParams, NFT, NFTCollection } from 'defi-sdk';
import type { NFTSortedByParamType } from './useAddressNfts';

export interface NFTCollectionStats {
  chains: string[];
  nfts_count?: number;
  prices?: NFT['prices'];
  min_changed_at?: number;
  max_changed_at?: number;
}

type Payload = AddressParams & {
  currency: string;
  sorted_by?: NFTSortedByParamType;
};

const namespace = 'address';
const scope = 'nft-collections-stats';

export interface NFTCollectionStatsResponse {
  collection: NFTCollection;
  stats: NFTCollectionStats;
}

export const useAddressNFTCollectionStats = createDomainHook<
  Payload,
  NFTCollectionStatsResponse[],
  typeof namespace,
  typeof scope
>({
  namespace,
  scope,
});

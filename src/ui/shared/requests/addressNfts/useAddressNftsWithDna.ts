import type { AddressNFT, AddressParams } from 'defi-sdk';
import { createDomainHook, mergeList } from 'defi-sdk';

export type NFTSortedByParamType =
  | 'floor_price_low'
  | 'last_price_low'
  | 'floor_price_high'
  | 'last_price_high'
  | 'created_recently'
  | 'created_long_ago';

type Payload = AddressParams & {
  currency: string;
  nft_limit?: number;
  nft_offset?: number;
  sorted_by?: NFTSortedByParamType;
  // mode?: NFTDisplayMode;
  contract_addresses?: string[] | null;
};

const namespace = 'address';
const scope = 'nft';

export const useAddressNfts = createDomainHook<
  Payload,
  AddressNFT[],
  typeof namespace,
  typeof scope
>({
  namespace,
  scope,
  getId: (addressNft: AddressNFT) => addressNft.id,
  mergeStrategy: mergeList,
});

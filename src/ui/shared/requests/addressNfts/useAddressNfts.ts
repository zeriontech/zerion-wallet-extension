
import { AddressParams, Result, client, createPaginatedDomainHook } from 'defi-sdk';
import type { AddressNFT } from './types';

export function getNftId(nft: AddressNFT) {
  return `${nft.chain}:${nft.contract_address}:${nft.token_id}`;
}

export type NFTSortedByParamType =
  | 'floor_price_low'
  | 'last_price_low'
  | 'floor_price_high'
  | 'last_price_high'
  | 'created_recently'
  | 'created_long_ago';

type Payload = AddressParams & {
  currency: string;
  sorted_by: NFTSortedByParamType;
  collection_ids?: (string | number)[];
  chains?: string[];
  limit?: number;
};

const namespace = 'address';
const scope = 'nft-positions';

export const useAddressNfts = createPaginatedDomainHook<
  Payload,
  AddressNFT,
  typeof namespace,
  typeof scope
>({
  namespace,
  scope,
  limitKey: 'nft_limit',
  method: 'get',
  getId: getNftId,
});

export async function getAddressNfts(payload: Payload) {
  return new Promise<Result<AddressL2NFT[], typeof scope>>((resolve) => {
    client.cachedSubscribe<AddressL2NFT[], typeof namespace, typeof scope>({
      namespace,
      body: {
        scope: [scope],
        payload,
      },
      onData: resolve,
    });
  });
}

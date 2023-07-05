import type { AddressParams, Result } from 'defi-sdk';
import { client, createPaginatedDomainHook } from 'defi-sdk';
import type { AddressNFT } from './types';
import { getNftId } from './getNftId';

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
  return new Promise<Result<AddressNFT[], typeof scope>>((resolve) => {
    client.cachedSubscribe<AddressNFT[], typeof namespace, typeof scope>({
      namespace,
      body: {
        scope: [scope],
        payload,
      },
      onData: (data) => {
        if (data.isDone) {
          resolve(data);
        }
      },
    });
  });
}

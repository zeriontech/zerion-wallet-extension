import { createDomainHook } from 'defi-sdk';
import type { AddressParams } from 'defi-sdk';
import type { NFTSortedByParamType } from './addressNfts/useAddressNfts';

type Payload = AddressParams & {
  currency: string;
  contract_addresses?: string[];
  sorted_by?: NFTSortedByParamType | 'amount_high';
};

export interface FullNFTCollection {
  address: string;
  description: string;
  icon_url: string | null;
  interface: string;
  name: string;
  nfts_amount: number;
  symbol: string;
  total_floor_price: string;
  slug: string;
}

const namespace = 'address';
const scope = 'nft-contracts';

export const useAddressNftContracts = createDomainHook<
  Payload,
  FullNFTCollection[],
  typeof namespace,
  typeof scope
>({ namespace, scope });

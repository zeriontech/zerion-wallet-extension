import type { AddressMembership, NFT } from 'defi-sdk';

export interface Payload {
  identifiers: string[];
}

export interface Identity {
  provider: 'ens' | 'lens' | 'ud' | 'unspecified';
  address: string;
  handle: string;
}

export interface WalletMeta {
  address: string;
  nft: {
    chain: string;
    contractAddress: string;
    tokenId: string;
    metadata: {
      name: string | null;
      content: NFT['metadata']['content'] | null;
    } | null;
  } | null;
  nftMetaInformation: {
    onboarded: boolean;
  } | null;
  identities: Identity[];
  membership: AddressMembership;
}

export interface Response {
  data: WalletMeta[] | null;
  errors?: { title: string; detail: string }[];
}

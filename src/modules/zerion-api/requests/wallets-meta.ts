import type { AddressMembership } from 'defi-sdk';
import { ZerionHttpClient } from '../shared';

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
      content: {
        imagePreviewUrl?: string;
        imageUrl?: string | null;
        audioUrl?: string | null;
        videoUrl?: string | null;
        type: 'video' | 'image' | 'audio';
      } | null;
    } | null;
  } | null;
  nftMetaInformation: {
    onboarded: boolean;
  } | null;
  identities: Identity[];
  membership: AddressMembership;
}

interface Payload {
  identifiers: string[];
}

interface Response {
  data: WalletMeta[] | null;
  errors?: { title: string; detail: string }[];
}

export function getWalletsMeta({ identifiers }: Payload) {
  const params = new URLSearchParams({ identifiers: identifiers.join(',') });
  const endpoint = `wallet/get-meta/v1?${params}`;
  return ZerionHttpClient.get<Response>({ endpoint });
}

import type { AddressMembership } from 'defi-sdk';
import type { ClientOptions } from '../shared';
import { CLIENT_DEFAULTS, ZerionHttpClient } from '../shared';

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

interface Params {
  identifiers: string[];
}

interface Response {
  data: WalletMeta[] | null;
  errors?: { title: string; detail: string }[];
}

export function getWalletsMeta(
  { identifiers }: Params,
  options: ClientOptions = CLIENT_DEFAULTS
) {
  const params = new URLSearchParams({ identifiers: identifiers.join(',') });
  const endpoint = `wallet/get-meta/v1?${params}`;
  return ZerionHttpClient.get<Response>({ endpoint, ...options });
}

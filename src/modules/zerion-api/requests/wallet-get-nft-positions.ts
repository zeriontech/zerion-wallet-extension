import { invariant } from 'src/shared/invariant';
import type { ClientOptions } from '../shared';
import { CLIENT_DEFAULTS, ZerionHttpClient } from '../shared';
import type { ZerionApiContext } from '../zerion-api-bare';

export type NftPaginationMeta = {
  pagination: {
    cursor: string;
  };
};

export type NftChain = {
  id: string;
  /** @example Ethereum */
  name: string;
  /** @example https://example.com/icon.png */
  iconUrl: string;
};

export type NftAmount = {
  currency: string;
  /** @description Amount in common units */
  quantity: string;
  /** @description Amount in fiat units */
  value: number | null;
  /** @description Amount in USD */
  usdValue: number | null;
};

export type NftCollectionMarketplaceData = {
  nativeFloorPrice: number | null;
  nativeTokenSymbol: string;
};

export type NftCollection = {
  id: string;
  name: string | null;
  iconUrl: string | null;
  marketplaceData: NftCollectionMarketplaceData | null;
};

export type NftLegacyMetadata = {
  name: string | null;
  content: {
    type: string;
    audioUrl: string | null;
    imagePreviewUrl: string | null;
    imageUrl: string | null;
    videoUrl: string | null;
  };
};

export type NFT = {
  /** @example ethereum:0x932261f9fc8da46c4a22e31b45c4de60623848bf:5555 */
  id: string;
  name: string | null;
  contractAddress: string;
  tokenId: string;
  /** @example ERC721 */
  interface: string;
  isSpam: boolean;
  previewUrl: string | null;
  chain: string;
  metadata: NftLegacyMetadata;
  collection: NftCollection;
};

export type NftPosition = {
  /** @example ethereum:0x932261f9fc8da46c4a22e31b45c4de60623848bf:5555 */
  id: string;
  amount: NftAmount;
  nft: NFT;
  chain: NftChain;
};

export type NftPositionSort =
  | 'created_recently'
  | 'created_long_ago'
  | 'floor_price_low'
  | 'floor_price_high';

export interface Params {
  addresses: string[];
  currency: string;
  collections?: string[];
  sort?: NftPositionSort;
  chain?: string;
  cursor?: string;
  limit?: number;
}

interface Response {
  data: NftPosition[];
  meta: NftPaginationMeta | null;
  errors: null;
}

export async function walletGetNftPositions(
  this: ZerionApiContext,
  params: Params,
  options: ClientOptions = CLIENT_DEFAULTS
) {
  invariant(params.addresses.length > 0, 'Addresses param is empty');
  const firstAddress = params.addresses[0];
  const provider = await this.getAddressProviderHeader(firstAddress);
  const kyOptions = this.getKyOptions();
  const endpoint = 'wallet/get-nft-positions/v1';
  return ZerionHttpClient.post<Response>(
    {
      endpoint,
      body: JSON.stringify(params),
      headers: { 'Zerion-Wallet-Provider': provider },
      ...options,
    },
    kyOptions
  );
}

import type { NFT } from 'defi-sdk';
import type { NftPosition } from 'src/modules/zerion-api/requests/wallet-get-nft-positions';

/**
 * Adapter from ZPI `NftPosition` (wallet-get-nft-position) into the defi-sdk
 * `NFT` shape that `createSendNFTAddressAction` consumes. Only the fields
 * actually read downstream are populated meaningfully — the rest are filled
 * with conservative defaults to satisfy the type contract.
 */
export function nftPositionToDefiSdkNft(position: NftPosition): NFT {
  const { nft } = position;
  return {
    contract_address: nft.contractAddress,
    contract_standard: (nft.interface === 'ERC1155'
      ? 'ERC1155'
      : 'ERC721') as NFT['contract_standard'],
    token_id: nft.tokenId,
    chain: nft.chain,
    metadata: {
      name: nft.metadata?.name ?? nft.name ?? '',
      tags: [],
      attributes: [],
      content: nft.metadata?.content
        ? {
            type:
              (nft.metadata.content.type as 'video' | 'image' | 'audio') ??
              'image',
            image_url: nft.metadata.content.imageUrl ?? undefined,
            image_preview_url:
              nft.metadata.content.imagePreviewUrl ?? undefined,
            audio_url: nft.metadata.content.audioUrl ?? undefined,
            video_url: nft.metadata.content.videoUrl ?? undefined,
          }
        : undefined,
    },
    collection: {
      id: 0,
      name: nft.collection?.name ?? undefined,
      icon_url: nft.collection?.iconUrl ?? undefined,
    },
    prices: {},
  };
}

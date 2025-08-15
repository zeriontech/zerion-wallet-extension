import React from 'react';
import type { NFTPreview } from 'src/modules/zerion-api/requests/wallet-get-actions';
import { TextLink } from 'src/ui/ui-kit/TextLink';

export function NFTLink({ nft }: { nft: NFTPreview }) {
  return (
    <TextLink
      to={`/nft/${nft.chain}/${nft.contractAddress}:${nft.tokenId}`}
      title={nft.metadata?.name || 'NFT'}
      style={{
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        outlineOffset: -1, // make focus ring visible despite overflow: hidden
      }}
    >
      {nft.metadata?.name || 'NFT'}
    </TextLink>
  );
}

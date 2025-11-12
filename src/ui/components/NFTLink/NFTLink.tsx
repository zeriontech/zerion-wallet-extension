import React from 'react';
import type { NFTPreview } from 'src/modules/zerion-api/requests/wallet-get-actions';
import { openInNewWindow } from 'src/ui/shared/openInNewWindow';
import { TextAnchor } from 'src/ui/ui-kit/TextAnchor';
import { TextLink } from 'src/ui/ui-kit/TextLink';

export function NFTAnchor({
  nft,
  address,
}: {
  nft: NFTPreview;
  address?: string;
}) {
  return (
    <TextAnchor
      href={`https://app.zerion.io/nfts/${nft.chain}/${nft.contractAddress}:${nft.tokenId}?address=${address}`}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => {
        e.stopPropagation();
        openInNewWindow(e);
      }}
      style={{
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        outlineOffset: -1, // make focus ring visible despite overflow: hidden
      }}
    >
      {nft.metadata?.name || 'NFT'}
    </TextAnchor>
  );
}

export function NFTLink({
  nft,
  style,
}: {
  nft: NFTPreview;
  style?: React.CSSProperties;
}) {
  return (
    <TextLink
      to={`/nft/${nft.chain}/${nft.contractAddress}:${nft.tokenId}`}
      title={nft.metadata?.name || 'NFT'}
      style={{
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        outlineOffset: -1, // make focus ring visible despite overflow: hidden
        ...style,
      }}
    >
      {nft.metadata?.name || 'NFT'}
    </TextLink>
  );
}

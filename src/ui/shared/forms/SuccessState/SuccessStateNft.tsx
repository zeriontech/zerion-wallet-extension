import type { AddressNFT } from 'defi-sdk';
import React from 'react';
import { MediaContent } from 'src/ui/ui-kit/MediaContent';
import { SquareElement } from 'src/ui/ui-kit/SquareElement';

export function SuccessStateNft({ nftItem }: { nftItem: AddressNFT }) {
  return (
    <SquareElement
      style={{ height: 72 }}
      render={(style) => (
        <MediaContent
          content={nftItem.metadata.content}
          forcePreview={true}
          alt={`${nftItem.metadata.name} image`}
          style={{
            ...style,
            aspectRatio: 'auto',
            display: 'block',
            borderRadius: 16,
            border: '4px solid var(--white)',
            objectFit: 'contain',
          }}
        />
      )}
    />
  );
}

import React from 'react';
import type { NftPosition } from 'src/modules/zerion-api/requests/wallet-get-nft-positions';
import { Image2 } from 'src/ui/ui-kit/MediaFallback';

const PREVIEW_SIZE = 46;

export function NftPreview({
  position,
  isLoading,
}: {
  position: NftPosition | null | undefined;
  isLoading: boolean;
}) {
  if (isLoading || !position) {
    return null;
  }

  const displayName =
    position.nft.name ||
    position.nft.metadata.name ||
    `#${position.nft.tokenId}`;

  return (
    <Image2
      src={position.nft.previewUrl ?? undefined}
      alt={`${displayName} image`}
      renderError={() => (
        <div
          style={{
            width: PREVIEW_SIZE,
            height: PREVIEW_SIZE,
            borderRadius: 20,
            background: 'var(--neutral-200)',
          }}
        />
      )}
      style={{
        width: PREVIEW_SIZE,
        height: PREVIEW_SIZE,
        borderRadius: 20,
        objectFit: 'cover',
        display: 'block',
        flexShrink: 0,
      }}
    />
  );
}

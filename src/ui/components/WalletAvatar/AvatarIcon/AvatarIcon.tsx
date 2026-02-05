import React, { useEffect } from 'react';
import { BlockieImg } from 'src/ui/components/BlockieImg';
import { MediaContent } from 'src/ui/ui-kit/MediaContent';
import type { WalletMeta } from 'src/modules/zerion-api/requests/wallet-get-meta';
import { GradientBorder } from 'src/ui/features/premium/GradientBorder';
import { convertMediaContent } from 'src/ui/ui-kit/MediaContent/MediaContent';
import * as s from './styles.module.css';

export function AvatarIcon({
  active,
  address,
  size,
  nft,
  borderRadius,
  borderWidth,
  onReady,
  highlight,
}: {
  active: boolean;
  address: string;
  size: number;
  nft?: WalletMeta['nft'];
  borderRadius: number;
  borderWidth?: number;
  onReady?(): void;
  highlight?: boolean;
}) {
  const mediaContent = nft?.metadata?.content;
  const hasMediaContent = Boolean(mediaContent);
  useEffect(() => {
    if (!hasMediaContent) {
      // means we're loading blockie and it's "ready" immediately
      onReady?.();
    }
  }, [hasMediaContent, onReady]);

  const strokeWidth = borderWidth ?? (size > 24 ? 2 : 1);
  const imageSize = highlight ? size - strokeWidth * 4 : size;
  const imageBorderRadius = highlight
    ? borderRadius - strokeWidth * 2
    : borderRadius;
  const padding = highlight ? strokeWidth * 2 : 0;

  return (
    <div className={s.root}>
      <div
        className={active ? s.activeIndicatorClip : undefined}
        style={{ width: size, height: size, padding }}
      >
        {highlight ? (
          <GradientBorder
            width={size}
            height={size}
            borderRadius={Number(borderRadius)}
            strokeWidth={strokeWidth}
          />
        ) : null}
        {nft?.metadata && mediaContent ? (
          <MediaContent
            className={s.media}
            style={{
              width: imageSize,
              height: imageSize,
              borderRadius: imageBorderRadius,
              objectFit: 'cover',
            }}
            errorStyle={{ width: imageSize, height: imageSize }}
            content={convertMediaContent(mediaContent)}
            alt={`${nft.metadata.name} image`}
            forcePreview={size <= 40 || mediaContent.type === 'audio'}
            onReady={onReady}
            renderUnsupportedContent={() => (
              <BlockieImg
                address={address}
                size={imageSize}
                borderRadius={imageBorderRadius}
              />
            )}
          />
        ) : (
          <BlockieImg
            address={address}
            size={imageSize}
            borderRadius={imageBorderRadius}
          />
        )}
      </div>
      {active ? <div className={s.activeIndicator} /> : null}
    </div>
  );
}

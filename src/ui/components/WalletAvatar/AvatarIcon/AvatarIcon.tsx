import React, { useEffect } from 'react';
import { BlockieImg } from 'src/ui/components/BlockieImg';
import { MediaContent } from 'src/ui/ui-kit/MediaContent';
import type { WalletProfile } from 'src/ui/shared/wallet/getWalletProfiles';
import * as s from './styles.module.css';

export function AvatarIcon({
  active,
  address,
  size,
  nft,
  borderRadius,
  onReady,
}: {
  active: boolean;
  address: string;
  size: number;
  nft?: WalletProfile['nft'];
  borderRadius: number;
  onReady?(): void;
}) {
  const mediaContent = nft?.metadata?.content;
  const hasMediaContent = Boolean(mediaContent);
  useEffect(() => {
    if (!hasMediaContent) {
      // means we're loading blockie and it's "ready" immediately
      onReady?.();
    }
  }, [hasMediaContent, onReady]);
  return (
    <div className={s.root}>
      <div className={active ? s.activeIndicatorClip : undefined}>
        {nft?.metadata && mediaContent ? (
          <MediaContent
            className={s.media}
            style={{
              width: size,
              height: size,
              borderRadius,
              objectFit: 'cover',
            }}
            errorStyle={{ width: size, height: size }}
            content={mediaContent}
            alt={`${nft.metadata.name} image`}
            forcePreview={size <= 40 || mediaContent.type === 'audio'}
            onReady={onReady}
          />
        ) : (
          <BlockieImg
            address={address}
            size={size}
            borderRadius={borderRadius}
          />
        )}
      </div>
      {active ? <div className={s.activeIndicator} /> : null}
    </div>
  );
}

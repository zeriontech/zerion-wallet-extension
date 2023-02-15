import React, { useMemo } from 'react';
import { BlockieImg } from 'src/ui/components/BlockieImg';
import { getMediaContent, MediaContent } from 'src/ui/ui-kit/MediaContent';
import { WalletProfileNFT } from '../types';
import * as s from './styles.module.css';

export function AvatarIcon({
  active,
  address,
  size,
  nft,
  borderRadius,
}: {
  active: boolean;
  address: string;
  size: number;
  nft?: WalletProfileNFT;
  borderRadius: number;
}) {
  const mediaContent = useMemo(
    () =>
      nft
        ? getMediaContent(nft.preview.url ? nft.preview : nft.detail)
        : undefined,
    [nft]
  );
  return (
    <div className={s.root}>
      <div className={active ? s.activeIndicatorClip : undefined}>
        {nft ? (
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
            alt={`${nft.name} image`}
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

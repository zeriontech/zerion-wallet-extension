import React from 'react';
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
}: {
  active: boolean;
  address: string;
  size: number;
  nft?: WalletProfile['nft'];
  borderRadius: number;
}) {
  return (
    <div className={s.root}>
      <div className={active ? s.activeIndicatorClip : undefined}>
        {nft?.metadata?.content ? (
          <MediaContent
            className={s.media}
            style={{
              width: size,
              height: size,
              borderRadius,
              objectFit: 'cover',
            }}
            errorStyle={{ width: size, height: size }}
            content={nft.metadata.content}
            alt={`${nft.metadata.name} image`}
            forcePreview={size <= 40}
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

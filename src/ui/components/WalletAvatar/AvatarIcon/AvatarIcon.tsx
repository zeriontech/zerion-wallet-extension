import React from 'react';
import { BlockieImg } from 'src/ui/components/BlockieImg';
import { MediaContent } from 'src/ui/ui-kit/MediaContent';
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
  borderRadius: string;
}) {
  return (
    <div className={s.root}>
      <div className={active ? s.activeIndicatorClip : undefined}>
        {nft ? (
          <MediaContent
            className={s.media}
            style={{ width: size, height: size, borderRadius }}
            errorStyle={{ width: size, height: size }}
            content={nft.preview.url ? nft.preview : nft.detail}
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

import React from 'react';
import { BlockieImg } from 'src/ui/components/BlockieImg';
import { MediaContent } from 'src/ui/ui-kit/MediaContent';
import { WalletProfileNFT } from '../types';
import * as s from './styles.module.css';

export function AvatarIcon({
  address,
  iconSize,
  nft,
}: {
  address: string;
  iconSize: number;
  nft?: WalletProfileNFT;
}) {
  return (
    <div className={s.root}>
      {nft ? (
        <MediaContent
          className={s.media}
          style={{ width: iconSize, height: iconSize }}
          errorStyle={{ width: iconSize, height: iconSize }}
          content={nft.preview.url ? nft.preview : nft.detail}
          alt={`${nft.name} image`}
        />
      ) : (
        <BlockieImg address={address} size={iconSize} />
      )}
    </div>
  );
}

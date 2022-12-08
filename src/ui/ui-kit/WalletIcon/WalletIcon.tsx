import React from 'react';
import { BlockieImg } from 'src/ui/components/BlockieImg';
import { Image } from 'src/ui/ui-kit/MediaFallback';
import GenesisStar from 'jsx:src/ui/assets/genesis-star.svg';
import * as s from './styles.module.css';

export function WalletIcon({
  active,
  address,
  iconSize,
  imageUrl,
  star,
}: {
  active: boolean;
  address: string;
  iconSize: number;
  imageUrl?: string;
  star?: boolean;
}) {
  return (
    <div className={s.root}>
      {star ? <GenesisStar className={s.star} /> : null}
      <div className={active ? s.activeIndicatorClip : undefined}>
        {imageUrl ? (
          <Image
            className={s.image}
            style={{ width: `${iconSize}px`, height: `${iconSize}px` }}
            src={imageUrl}
            renderError={() => <BlockieImg address={address} size={iconSize} />}
          />
        ) : (
          <BlockieImg address={address} size={iconSize} />
        )}
      </div>
      {active ? <div className={s.activeIndicator} /> : null}
    </div>
  );
}

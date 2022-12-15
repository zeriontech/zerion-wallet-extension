import React from 'react';
import { BlockieImg } from 'src/ui/components/BlockieImg';
import { Image } from 'src/ui/ui-kit/MediaFallback';
import * as s from './styles.module.css';

export function WalletIcon({
  active,
  address,
  iconSize,
  imageUrl,
}: {
  active: boolean;
  address: string;
  iconSize: number;
  imageUrl?: string;
}) {
  return (
    <div className={s.root}>
      <div className={active ? s.activeIndicatorClip : undefined}>
        {imageUrl ? (
          <Image
            className={s.image}
            style={{ width: iconSize, height: iconSize }}
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

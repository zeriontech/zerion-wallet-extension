import React from 'react';
import { BlockieImg } from 'src/ui/components/BlockieImg';
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
          <img className={s.image} src={imageUrl} />
        ) : (
          <BlockieImg address={address} size={iconSize} />
        )}
      </div>
      {active ? <div className={s.activeIndicator} /> : null}
    </div>
  );
}

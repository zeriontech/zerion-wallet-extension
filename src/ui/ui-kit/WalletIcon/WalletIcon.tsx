import React from 'react';
import { BlockieImg } from 'src/ui/components/BlockieImg';
import * as s from './styles.module.css';

export function WalletIcon({
  active,
  address,
  iconSize,
}: {
  active: boolean;
  address: string;
  iconSize: number;
}) {
  return (
    <div className={s.root}>
      <div className={active ? s.activeIndicatorClip : undefined}>
        <BlockieImg address={address} size={iconSize} />
      </div>
      {active ? <div className={s.activeIndicator} /> : null}
    </div>
  );
}

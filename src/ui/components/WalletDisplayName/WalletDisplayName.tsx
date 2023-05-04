import React from 'react';
import type { BareWallet } from 'src/shared/types/BareWallet';
import { useProfileName } from 'src/ui/shared/useProfileName';
import { DelayedRender } from '../DelayedRender';

export function WalletDisplayName({
  wallet,
  padding,
  maxCharacters,
  delayedRender = 0,
}: {
  wallet: Pick<BareWallet, 'address' | 'name'>;
  padding?: number;
  maxCharacters?: number;
  delayedRender?: number;
}) {
  const displayName = useProfileName(wallet, {
    padding,
    maxCharacters,
  });
  return (
    <DelayedRender delay={delayedRender}>
      <span style={{ wordBreak: 'break-all' }}>{displayName}</span>
    </DelayedRender>
  );
}

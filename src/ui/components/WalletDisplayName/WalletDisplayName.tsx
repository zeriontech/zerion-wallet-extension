import React from 'react';
import type { BareWallet } from 'src/shared/types/BareWallet';
import { useProfileName } from 'src/ui/shared/useProfileName';

export function WalletDisplayName({
  wallet,
  padding,
  maxCharacters,
}: {
  wallet: Pick<BareWallet, 'address' | 'name'>;
  padding?: number;
  maxCharacters?: number;
}) {
  const displayName = useProfileName(wallet, {
    padding,
    maxCharacters,
  });
  return <span style={{ wordBreak: 'break-all' }}>{displayName}</span>;
}

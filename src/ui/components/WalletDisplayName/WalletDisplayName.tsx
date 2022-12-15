import React from 'react';
import type { BareWallet } from 'src/shared/types/BareWallet';
import { useWalletDisplayName } from 'src/ui/shared/useWalletDisplayName';

export function WalletDisplayName({
  wallet,
  padding,
  maxCharacters,
}: {
  wallet: BareWallet;
  padding?: number;
  maxCharacters?: number;
}) {
  const displayName = useWalletDisplayName(wallet.address, wallet.name, {
    padding,
    maxCharacters,
  });
  return <span style={{ wordBreak: 'break-all' }}>{displayName}</span>;
}

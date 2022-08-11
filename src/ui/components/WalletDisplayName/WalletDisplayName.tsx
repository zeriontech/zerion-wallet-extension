import React from 'react';
import type { BareWallet } from 'src/shared/types/BareWallet';
import { getWalletDisplayName } from 'src/ui/shared/getWalletDisplayName';

export function WalletDisplayName({
  wallet,
  padding,
  maxCharacters,
}: {
  wallet: BareWallet;
  padding?: number;
  maxCharacters?: number;
}) {
  return (
    <span style={{ wordBreak: 'break-all' }}>
      {getWalletDisplayName(wallet, { padding, maxCharacters })}
    </span>
  );
}

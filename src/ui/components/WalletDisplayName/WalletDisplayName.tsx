import React from 'react';
import type { ExternallyOwnedAccount } from 'src/shared/types/ExternallyOwnedAccount';
import { useProfileName } from 'src/ui/shared/useProfileName';

export function WalletDisplayName({
  wallet,
  padding,
  maxCharacters,
}: {
  wallet: ExternallyOwnedAccount;
  padding?: number;
  maxCharacters?: number;
}) {
  const displayName = useProfileName(wallet, {
    padding,
    maxCharacters,
  });
  return <span style={{ wordBreak: 'break-all' }}>{displayName}</span>;
}

import React from 'react';
import type { ExternallyOwnedAccount } from 'src/shared/types/ExternallyOwnedAccount';
import { useProfileName } from 'src/ui/shared/useProfileName';

export function WalletDisplayName({
  wallet,
  padding,
  maxCharacters,
  render,
}: {
  wallet: ExternallyOwnedAccount;
  padding?: number;
  maxCharacters?: number;
  render?: (data: ReturnType<typeof useProfileName>) => React.ReactNode;
}) {
  const data = useProfileName(wallet, {
    padding,
    maxCharacters,
  });
  if (render) {
    return render(data);
  }
  return <span style={{ wordBreak: 'break-all' }}>{data.value}</span>;
}

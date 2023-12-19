import React from 'react';
import { useQuery } from '@tanstack/react-query';
import LedgerIcon from 'jsx:src/ui/assets/ledger-icon-small.svg';
import { isDeviceAccount } from 'src/shared/types/validators';
import { walletPort } from 'src/ui/shared/channels';

export function WalletSourceIcon({
  address,
  style,
}: {
  address: string;
  style?: React.CSSProperties;
}) {
  const { data: wallet } = useQuery({
    queryKey: ['wallet/uiGetWalletByAddress', address],
    queryFn: () => walletPort.request('uiGetWalletByAddress', { address }),
    suspense: false,
  });

  if (!wallet) {
    return null;
  }

  return isDeviceAccount(wallet) ? (
    <LedgerIcon
      style={{ position: 'absolute', bottom: 0, right: 0, ...style }}
    />
  ) : null;
}

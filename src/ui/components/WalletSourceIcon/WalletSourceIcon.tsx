import React from 'react';
import { useQuery } from '@tanstack/react-query';
import LedgerIcon from 'jsx:src/ui/assets/ledger-icon-small.svg';
import WatchAddressIcon from 'jsx:src/ui/assets/watch-address.svg';
import {
  isDeviceAccount,
  isReadonlyAccount,
} from 'src/shared/types/validators';
import { walletPort } from 'src/ui/shared/channels';

export function WalletSourceIcon({
  address,
  groupId,
  style,
  borderRadius = 6,
  cutoutStroke = 2,
}: {
  address: string;
  groupId: string | null;
  borderRadius?: number;
  cutoutStroke?: number;
  style?: React.CSSProperties;
}) {
  const { data: wallet } = useQuery({
    queryKey: ['wallet/uiGetWalletByAddress', address, groupId],
    queryFn: () =>
      walletPort.request('uiGetWalletByAddress', { address, groupId }),
    suspense: false,
  });

  if (!wallet) {
    return null;
  }

  return isDeviceAccount(wallet) ? (
    <LedgerIcon
      style={{ position: 'absolute', bottom: 0, right: 0, ...style }}
    />
  ) : isReadonlyAccount(wallet) ? (
    <WatchAddressIcon
      style={{
        position: 'absolute',
        width: 16,
        height: 16,
        bottom: -2,
        right: -2,
        borderRadius,
        border: 'solid var(--white)',
        borderWidth: cutoutStroke,
        ...style,
      }}
    />
  ) : null;
}

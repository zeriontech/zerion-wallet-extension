import { useStore } from '@store-unit/react';
import React from 'react';
import type { ExternallyOwnedAccount } from 'src/shared/types/ExternallyOwnedAccount';
import { hideBalancesStore } from 'src/ui/features/hide-balances/store';
import { useProfileName } from 'src/ui/shared/useProfileName';

interface Props {
  wallet: ExternallyOwnedAccount;
  padding?: number;
  maxCharacters?: number;
  tryEns?: boolean;
  render?: (data: ReturnType<typeof useProfileName>) => React.ReactNode;
}

export function WalletDisplayNameBase({
  wallet,
  padding,
  maxCharacters,
  tryEns = true,
  render,
}: Props) {
  const data = useProfileName(wallet, {
    padding,
    maxCharacters,
    enabled: tryEns,
  });
  if (render) {
    return render(data);
  }
  return <span style={{ wordBreak: 'break-all' }}>{data.value}</span>;
}

const toFakeAddr = (address: string) => {
  const shifted =
    BigInt(address) - 99999999999999999999999999999999999999999999999n;
  return `0x${shifted.toString(16)}`;
};

export function WalletDisplayName(props: Props) {
  const { mode } = useStore(hideBalancesStore);
  if (mode !== hideBalancesStore.MODE.default) {
    const fakeAddr = toFakeAddr(props.wallet.address);
    const wallet = { ...props.wallet, address: fakeAddr };
    return <WalletDisplayNameBase {...props} wallet={wallet} tryEns={false} />;
  } else {
    return <WalletDisplayNameBase {...props} />;
  }
}

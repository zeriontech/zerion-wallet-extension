import React from 'react';
import type { BareWallet } from 'src/shared/types/BareWallet';
import { useWalletDisplayName } from 'src/ui/shared/useWalletDisplayName';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { WalletAvatar } from '../WalletAvatar';

export function AddressBadge({
  wallet,
  style,
}: {
  wallet: BareWallet;
  style?: React.CSSProperties;
}) {
  const displayName = useWalletDisplayName(wallet.address, {
    name: wallet.name,
    padding: 4,
    maxCharacters: 16,
  });
  return (
    <HStack
      alignItems="center"
      gap={4}
      style={{
        backgroundColor: 'var(--neutral-200)',
        padding: '2px 4px',
        borderRadius: 4,
        display: 'inline-flex',
        ...style,
      }}
    >
      <WalletAvatar address={wallet.address} size={14} borderRadius={4} />
      <UIText
        kind="subtitle/s_reg"
        style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}
      >
        {displayName}
      </UIText>
    </HStack>
  );
}

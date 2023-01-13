import React from 'react';
import type { BareWallet } from 'src/shared/types/BareWallet';
import { WalletDisplayName } from 'src/ui/components/WalletDisplayName';
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
        <WalletDisplayName wallet={wallet} maxCharacters={16} padding={4} />
      </UIText>
    </HStack>
  );
}

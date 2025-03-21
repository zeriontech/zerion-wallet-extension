import React from 'react';
import { WalletDisplayName } from 'src/ui/components/WalletDisplayName';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import type { ExternallyOwnedAccount } from 'src/shared/types/ExternallyOwnedAccount';
import { WalletAvatar } from '../WalletAvatar';

export function AddressBadge({
  wallet,
  size = 20,
  style,
  captionStyle,
}: {
  size?: number;
  wallet: ExternallyOwnedAccount;
  style?: React.CSSProperties;
  captionStyle?: React.CSSProperties;
}) {
  return (
    <HStack
      alignItems="center"
      gap={4}
      style={{
        backgroundColor: 'var(--neutral-100)',
        borderRadius: 4,
        display: 'inline-flex',
        ...style,
      }}
    >
      <WalletAvatar address={wallet.address} size={size} borderRadius={4} />
      <UIText
        kind="caption/regular"
        style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          paddingBlock: 2,
          paddingInlineEnd: 4,
          ...captionStyle,
        }}
      >
        <WalletDisplayName wallet={wallet} maxCharacters={16} padding={4} />
      </UIText>
    </HStack>
  );
}

import React from 'react';
import type { BareWallet } from 'src/shared/types/BareWallet';
import { getWalletDisplayName } from 'src/ui/shared/getWalletDisplayName';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { BlockieImg } from '../BlockieImg';

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
      <BlockieImg address={wallet.address} size={14} />
      <UIText
        kind="subtitle/s_reg"
        style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}
      >
        {getWalletDisplayName(wallet, { padding: 4, maxCharacters: 16 })}
      </UIText>
    </HStack>
  );
}

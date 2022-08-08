import React from 'react';
import type { BareWallet } from 'src/shared/types/BareWallet';
import { getWalletDisplayName } from 'src/ui/shared/getWalletDisplayName';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { BlockieImg } from '../BlockieImg';

export function AddressBadge({ wallet }: { wallet: BareWallet }) {
  return (
    <UIText
      kind="subtitle/s_reg"
      style={{
        backgroundColor: 'var(--neutral-200)',
        padding: '2px 4px',
        borderRadius: 4,
      }}
    >
      <HStack alignItems="center" gap={4}>
        <BlockieImg address={wallet.address} size={14} />
        <span>
          {getWalletDisplayName(wallet, { padding: 4, maxCharacters: 16 })}
        </span>
      </HStack>
    </UIText>
  );
}

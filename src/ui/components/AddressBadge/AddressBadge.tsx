import React from 'react';
import { truncateAddress } from 'src/ui/shared/truncateAddress';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { BlockieImg } from '../BlockieImg';

export function AddressBadge({ address }: { address: string }) {
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
        <BlockieImg address={address} size={14} />
        <span>{truncateAddress(address, 4)}</span>
      </HStack>
    </UIText>
  );
}

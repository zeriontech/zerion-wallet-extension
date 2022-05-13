import React from 'react';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';

export function NetworkIndicator({ size = 20 }: { size?: number }) {
  return (
    <HStack gap={4} alignItems="center">
      <img
        src="https://chain-icons.s3.amazonaws.com/ethereum.png"
        alt=""
        style={{ width: size, height: size }}
      />
      <UIText kind="subtitle/m_reg">Ethereum</UIText>
    </HStack>
  );
}

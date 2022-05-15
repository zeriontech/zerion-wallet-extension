import React from 'react';
import { ethers } from 'ethers';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';

const chainNameById: Record<string, string | undefined> = {
  '0x1': 'Ethereum',
  '0x89': 'Polygon',
};
const chainIconById: Record<string, string | undefined> = {
  '0x1': 'https://chain-icons.s3.amazonaws.com/ethereum.png',
  '0x89': 'https://chain-icons.s3.amazonaws.com/polygon.png',
};

export function NetworkIndicator({
  chainId: chainIdRaw = 1,
  size = 20,
}: {
  chainId?: string | number;
  size?: number;
}) {
  const chainId = ethers.utils.hexValue(chainIdRaw);
  return (
    <HStack gap={4} alignItems="center">
      <img
        src={chainIconById[chainId] || ''}
        alt=""
        style={{ width: size, height: size }}
      />
      <UIText kind="subtitle/m_reg">{chainNameById[chainId] || chainId}</UIText>
    </HStack>
  );
}

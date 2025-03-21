import React from 'react';
import { HStack } from 'src/ui/ui-kit/HStack';
import { type BlockchainType } from 'src/shared/wallet/classifiers';
import EcosystemEthereumIcon from 'jsx:src/ui/assets/ecosystem-ethereum.svg';
import EcosystemSolanaIcon from 'jsx:src/ui/assets/ecosystem-solana.svg';

export function BlockchainTitleHelper({ kind }: { kind: BlockchainType }) {
  const config = {
    solana: { icon: <EcosystemSolanaIcon />, title: 'Solana wallets' },
    evm: {
      icon: <EcosystemEthereumIcon />,
      title: 'EVM wallets',
    },
  };

  return (
    <HStack gap={8} alignItems="center">
      {config[kind].icon}
      <span>{config[kind].title}</span>
    </HStack>
  );
}

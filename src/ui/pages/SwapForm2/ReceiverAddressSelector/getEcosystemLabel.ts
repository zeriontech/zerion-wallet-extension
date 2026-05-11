import type { BlockchainType } from 'src/shared/wallet/classifiers';

export function getEcosystemLabel(ecosystem: BlockchainType): string {
  switch (ecosystem) {
    case 'solana':
      return 'Solana';
    case 'evm':
      return 'Ethereum';
  }
}

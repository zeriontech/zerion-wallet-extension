import { isSolanaAddress } from 'src/modules/solana/shared';
import { isEthereumAddress } from '../isEthereumAddress';

export const BLOCKCHAIN_TYPES = ['evm', 'solana'] as const;
export type BlockchainType = (typeof BLOCKCHAIN_TYPES)[number];

export function getAddressType(address: string): BlockchainType {
  if (isEthereumAddress(address)) {
    return 'evm';
  } else if (isSolanaAddress(address)) {
    return 'solana';
  } else {
    throw new Error(`Unexpected address type: ${address}`);
  }
}

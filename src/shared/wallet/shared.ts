import { isSolanaAddress } from 'src/modules/solana/shared';
import { invariant } from '../invariant';
import { isEthereumAddress } from '../isEthereumAddress';
import { BLOCKCHAIN_TYPES, type BlockchainType } from './classifiers';

const supportedTypes = new Set<BlockchainType>(BLOCKCHAIN_TYPES);

function isSubsetOf<T>(a: Set<T>, b: unknown[]): b is T[] {
  return b.every((item) => a.has(item as T));
}

export function assertKnownEcosystems(
  values: string[]
): asserts values is BlockchainType[] {
  invariant(
    isSubsetOf(supportedTypes, values),
    `Invalid ecosystem values: ${values}`
  );
}

export function isMatchForEcosystem(
  address: string,
  ecosystem: BlockchainType
) {
  if (ecosystem === 'evm') {
    return isEthereumAddress(address);
  } else if (ecosystem === 'solana') {
    return isSolanaAddress(address);
  } else {
    throw new Error(`Unsupported ecosystem param: ${ecosystem}`);
  }
}

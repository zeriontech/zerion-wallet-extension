import { invariant } from '../invariant';
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

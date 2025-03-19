import { invariant } from '../invariant';
import { blockchainTypes, type BlockchainType } from './classifiers';

const supportedTypes = new Set<BlockchainType>(blockchainTypes);

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

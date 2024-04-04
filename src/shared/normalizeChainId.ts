import type { Brand } from './type-utils/Brand';
import { valueToHex } from './units/valueToHex';

export type ChainId = Brand<string, 'chainIdAsHex'>;

export function normalizeChainId(value: string | number): ChainId {
  return valueToHex(value) as ChainId;
}

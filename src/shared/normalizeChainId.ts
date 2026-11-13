import type { ChainId } from 'src/modules/ethereum/transactions/ChainId';
import type { LegacyBigNumber } from './units/legacyBigNumber';
import { valueToHex } from './units/valueToHex';

export function normalizeChainId(value: string | number | bigint | LegacyBigNumber): ChainId {
  const sanitized = typeof value === 'string' ? value.trim() : value;
  return valueToHex(sanitized).toLowerCase() as ChainId;
}

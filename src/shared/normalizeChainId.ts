import type { ChainId } from 'src/modules/ethereum/transactions/ChainId';
import { valueToHex, type EthersV5BigNumber } from './units/valueToHex';

export function normalizeChainId(value: string | number | bigint | EthersV5BigNumber): ChainId {
  const sanitized = typeof value === 'string' ? value.trim() : value;
  return valueToHex(sanitized).toLowerCase() as ChainId;
}

import type { BigNumber } from '@ethersproject/bignumber';
import type { ChainId } from 'src/modules/ethereum/transactions/ChainId';
import { valueToHex } from './units/valueToHex';

export function normalizeChainId(
  value: string | number | bigint | BigNumber
): ChainId {
  const sanitized = typeof value === 'string' ? value.trim() : value;
  return valueToHex(sanitized).toLowerCase() as ChainId;
}

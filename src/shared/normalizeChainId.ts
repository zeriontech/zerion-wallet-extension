import type { BigNumber } from '@ethersproject/bignumber';
import type { ChainId } from 'src/modules/ethereum/transactions/ChainId';
import { valueToHex } from './units/valueToHex';

export function normalizeChainId(
  value: string | number | bigint | BigNumber
): ChainId {
  return valueToHex(value) as ChainId;
}

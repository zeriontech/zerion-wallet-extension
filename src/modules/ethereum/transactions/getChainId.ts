import { valueToHex } from 'src/shared/units/valueToHex';
import type { IncomingTransaction } from '../types/IncomingTransaction';
import { ChainIdValue } from './ChainIdValue';

export function getChainId(transaction: IncomingTransaction) {
  const { chainId } = transaction;
  return chainId ? valueToHex(chainId) : ChainIdValue.Mainnet;
}

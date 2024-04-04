import { ethers } from 'ethers';
import type { IncomingTransaction } from '../types/IncomingTransaction';
import { ChainIdValue } from './ChainIdValue';

export function getChainId(transaction: IncomingTransaction) {
  const { chainId } = transaction;
  return chainId ? ethers.utils.hexValue(chainId) : ChainIdValue.Mainnet;
}

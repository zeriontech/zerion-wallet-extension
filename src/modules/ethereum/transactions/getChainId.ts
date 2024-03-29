import { ethers } from 'ethers';
import type { IncomingTransaction } from '../types/IncomingTransaction';
import { ChainId } from './ChainId';

export function getChainId(transaction: IncomingTransaction) {
  const { chainId } = transaction;
  return chainId ? ethers.utils.hexValue(chainId) : ChainId.Mainnet;
}

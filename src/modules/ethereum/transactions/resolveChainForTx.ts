import { ethers } from 'ethers';
import type { Chain } from 'src/modules/networks/Chain';
import type { Networks } from 'src/modules/networks/Networks';
import type {
  IncomingTransaction,
  IncomingTransactionWithChainId,
} from '../types/IncomingTransaction';

export function getTransactionChainId(
  transaction: IncomingTransaction
): string | null {
  return transaction.chainId
    ? ethers.utils.hexValue(transaction.chainId)
    : null;
}

export function resolveChainForTx(
  transaction: IncomingTransaction,
  originChain: Chain,
  networks: Networks
): Chain {
  const targetChainId = getTransactionChainId(transaction);
  return targetChainId ? networks.getChainById(targetChainId) : originChain;
}

export function setTransactionChainId(
  transaction: IncomingTransaction,
  currentChain: Chain,
  networks: Networks
): IncomingTransactionWithChainId {
  const chain = resolveChainForTx(transaction, currentChain, networks);
  const chainId = networks.getChainId(chain);
  return { ...transaction, chainId };
}

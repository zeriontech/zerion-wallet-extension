import { ethers } from 'ethers';
import type { Chain } from 'src/modules/networks/Chain';
import { networksStore } from 'src/modules/networks/networks-store';
import type { IncomingTransaction } from '../types/IncomingTransaction';

export function getTransactionChainId(
  transaction: IncomingTransaction
): string | null {
  return transaction.chainId
    ? ethers.utils.hexValue(transaction.chainId)
    : null;
}

export async function resolveChainForTx(
  transaction: IncomingTransaction,
  originChain: Chain
): Promise<Chain> {
  const networks = await networksStore.load();
  const targetChainId = getTransactionChainId(transaction);
  return targetChainId ? networks.getChainById(targetChainId) : originChain;
}

import { ethers } from 'ethers';
import type { Chain } from 'src/modules/networks/Chain';
import type { Networks } from 'src/modules/networks/Networks';
import type { IncomingTransaction } from '../types/IncomingTransaction';

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

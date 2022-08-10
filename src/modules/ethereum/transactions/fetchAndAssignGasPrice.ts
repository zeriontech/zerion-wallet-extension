import { ethers } from 'ethers';
import { networksStore } from 'src/modules/networks/networks-store';
import type { UnsignedTransaction } from '../types/UnsignedTransaction';
import { assignGasPrice } from './gasPrices/assignGasPrice';
import { gasChainPricesSubscription } from './gasPrices/requests';

export async function fetchAndAssignGasPrice(transaction: UnsignedTransaction) {
  const { chainId } = transaction;
  if (!chainId) {
    throw new Error('Transaction object must have a chainId property');
  }
  const [networks, gasChainPrices] = await Promise.all([
    networksStore.load(),
    gasChainPricesSubscription.get(),
  ]);
  const chain = networks.getChainById(ethers.utils.hexValue(chainId));
  const gasPricesInfo = gasChainPrices[chain.toString()];
  if (!gasPricesInfo) {
    throw new Error(`Gas Price info for ${chain.toString()} not found`);
  }
  const { eip1559, classic } = gasPricesInfo.info;

  assignGasPrice(transaction, {
    eip1559: eip1559?.fast,
    classic: classic?.fast,
  });
}

import type BigNumber from 'bignumber.js';
import type { IncomingTransaction } from '../../types/IncomingTransaction';
import { resolveChainId } from '../resolveChainId';
import { estimateFee } from './eip1559/estimateFee';
import { getEip1559Base } from './eip1559/getEip1559Base';
import type { GasPriceObject } from './GasPriceObject';
import { hexifyTxValues } from './hexifyTxValues';
import { createOptimisticFee } from './optimistic/fee';
import type { ChainGasPrice } from './requests';

export interface EstimatedFeeValue {
  estimatedFee: number | BigNumber;
  maxFee?: number | BigNumber;
  type: keyof ChainGasPrice['info'];
}

export async function estimateNetworkFee({
  address,
  gas,
  gasPrices,
  gasPrice,
  transaction,
  getNonce,
}: {
  address: string | null;
  gas: string | number | null;
  gasPrices: ChainGasPrice | null /** it is possible to estimate classic fee is gasPrices is null */;
  gasPrice: GasPriceObject | null;
  transaction: IncomingTransaction | null;
  getNonce: (address: string, chainId: string) => Promise<number>;
}): Promise<EstimatedFeeValue | null> {
  if (!gas || gas === '') {
    return null;
  }
  const optimistic = gasPrices?.info.optimistic;
  const chainId = transaction ? resolveChainId(transaction) : null;
  const shouldTryOptimistic = Boolean(optimistic);
  const optimisticFee =
    optimistic && transaction && address
      ? await createOptimisticFee({
          optimisticGasPriceInfo: optimistic,
          transaction: hexifyTxValues(transaction),
          getNonce: async () => (chainId ? getNonce(address, chainId) : 0),
        })
      : 'not-enough-data';

  const shouldUseOptimistic = shouldTryOptimistic
    ? optimisticFee != null
    : false;
  const optimisticFeeValue =
    optimisticFee === 'not-enough-data' ? null : optimisticFee;

  if (shouldUseOptimistic) {
    if (!optimisticFeeValue) {
      return null;
    }
    const { estimatedFee, maxFee } = optimisticFeeValue;
    return { estimatedFee, maxFee, type: 'optimistic' };
  }
  if (!gasPrice) {
    return null;
  }
  const { eip1559, classic } = gasPrice;
  if (eip1559 && gasPrices?.info.eip1559) {
    const estimatedFee = estimateFee({
      gas,
      eip1559Base: getEip1559Base(eip1559, gasPrices.info.eip1559),
    });
    return { estimatedFee, type: 'eip1559' };
  }
  if (classic) {
    return { estimatedFee: Number(gas) * Number(classic), type: 'classic' };
  }
  return null;
}

import type BigNumber from 'bignumber.js';
import type { IncomingTransaction } from '../../types/IncomingTransaction';
import { resolveChainId } from '../resolveChainId';
import type { ChainId } from '../ChainId';
import { estimateFee } from './eip1559/estimateFee';
import type { GasPriceObject } from './GasPriceObject';
import { hexifyTxValues } from './hexifyTxValues';
import { createOptimisticFee } from './optimistic/fee';
import type { ChainGasPrice } from './types';

export interface EstimatedFeeValue {
  estimatedFee: number | BigNumber;
  maxFee?: number | BigNumber;
  type: Exclude<keyof ChainGasPrice['fast'], 'eta'>;
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
  gasPrices: ChainGasPrice | null /** it is possible to estimate classic fee if gasPrices is null */;
  gasPrice: GasPriceObject | null;
  transaction: IncomingTransaction | null;
  getNonce: (address: string, chainId: ChainId) => Promise<number>;
}): Promise<EstimatedFeeValue | null> {
  if (!gas || gas === '') {
    return null;
  }
  const chainId = transaction ? resolveChainId(transaction) : null;
  const shouldTryOptimistic = Boolean(gasPrices?.fast.optimistic);
  const optimisticFee =
    gasPrices?.fast && transaction && address
      ? await createOptimisticFee({
          gasPriceInfo: gasPrices?.fast,
          gasPriceObject: gasPrice,
          gasLimit: gas,
          transaction: hexifyTxValues({ transaction }),
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
  if (eip1559 && gasPrices?.fast.eip1559) {
    const estimatedFee = estimateFee({
      gas,
      eip1559,
      baseFee: gasPrices.fast.eip1559.baseFee,
    });
    const maxFee = Number(gas) * eip1559.maxFee;
    return { estimatedFee, maxFee, type: 'eip1559' };
  }
  if (classic) {
    return { estimatedFee: Number(gas) * Number(classic), type: 'classic' };
  }
  return null;
}

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
  type: 'eip1559' | 'classic' | 'optimistic';
}

export async function estimateNetworkFee({
  address,
  gas,
  expectedGas,
  gasPrices,
  gasPrice,
  transaction,
  getNonce,
}: {
  address: string | null;
  gas: string | number | null;
  /** Expected gas units the fee is priced on (WLT-2743); falls back to `gas`. */
  expectedGas?: number | null;
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

  const shouldUseOptimistic = shouldTryOptimistic ? optimisticFee != null : false;
  const optimisticFeeValue = optimisticFee === 'not-enough-data' ? null : optimisticFee;

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
  const gasUnits = expectedGas != null && expectedGas > 0 ? expectedGas : Number(gas);
  const { eip1559, classic } = gasPrice;
  if (eip1559 && gasPrices?.fast.eip1559) {
    const estimatedFee = estimateFee({
      gas: gasUnits,
      eip1559,
      baseFee: gasPrices.fast.eip1559.baseFee,
    });
    // The balance reserve stays on the execution limit: WLT-2743 requires
    // `maxFeePerGas × gasLimit`, not the expected-gas cost.
    const maxFee = Number(gas) * eip1559.maxFee;
    return { estimatedFee, maxFee, type: 'eip1559' };
  }
  if (classic) {
    return {
      estimatedFee: gasUnits * Number(classic),
      maxFee: Number(gas) * Number(classic),
      type: 'classic',
    };
  }
  return null;
}

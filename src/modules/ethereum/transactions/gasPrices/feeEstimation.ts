import type BigNumber from 'bignumber.js';
import { ethers } from 'ethers';
import memoize from 'lodash/memoize';
import { networksStore } from 'src/modules/networks/networks-store.client';
import { getRpcProvider } from '../../requests/getRpcProvider';
import type { IncomingTransaction } from '../../types/IncomingTransaction';
import { estimateFee } from './eip1559/estimateFee';
import { getEip1559Base } from './eip1559/getEip1559Base';
import type { GasPriceObject } from './GasPriceObject';
import { hexifyTxValues } from './hexifyTxValues';
import { createOptimisticFee } from './optimistic/fee';
import type { ChainGasPrice } from './requests';

interface EstimatedFeeValue {
  value: number | BigNumber;
  type: keyof ChainGasPrice['info'];
}

const getNonce = memoize(async (address: string, chainId: string) => {
  const networks = await networksStore.load();
  const chain = chainId
    ? networks.getChainById(ethers.utils.hexValue(chainId))
    : null;
  const rpcUrl = chain ? networks.getRpcUrlInternal(chain) : null;
  const rpcProvider = rpcUrl ? getRpcProvider(rpcUrl) : null;
  if (rpcProvider) {
    return rpcProvider.getTransactionCount(address);
  } else {
    return 0;
  }
});

export async function getNetworkFeeEstimation({
  address,
  gas,
  gasPrices,
  gasPrice,
  transaction,
}: {
  address: string | null;
  gas: string | number | null;
  gasPrices: ChainGasPrice | null;
  gasPrice: GasPriceObject;
  transaction: IncomingTransaction | null;
}): Promise<EstimatedFeeValue | null> {
  if (!gasPrices || !gas || gas === '') {
    return null;
  }
  const { optimistic } = gasPrices.info;
  const chainId = transaction ? transaction.chainId : null;
  const shouldTryOptimistic = Boolean(optimistic);
  const optimisticFee =
    optimistic && transaction && address
      ? await createOptimisticFee({
          optimisticGasPriceInfo: optimistic,
          from: address,
          transaction: hexifyTxValues(transaction),
          getNonce: async (address: string) =>
            chainId ? getNonce(address, ethers.utils.hexValue(chainId)) : 0,
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
    const estimatedFeeInBaseUnits = optimisticFeeValue.estimatedFee;
    return { value: estimatedFeeInBaseUnits, type: 'optimistic' };
  }
  const { eip1559, classic } = gasPrice;
  if (eip1559 && gasPrices.info.eip1559) {
    const estimatedFee = estimateFee({
      gas,
      eip1559Base: getEip1559Base(eip1559, gasPrices.info.eip1559),
    });
    return { value: estimatedFee, type: 'eip1559' };
  }
  if (classic) {
    return { value: Number(gas) * Number(classic), type: 'classic' };
  }
  return null;
}

import { ethers } from 'ethers';
import type { IncomingTransaction } from '../../types/IncomingTransaction';
import type { GasPriceObject } from './GasPriceObject';
import type { ChainGasPrice } from './requests';

interface EIP1559Props {
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
}

interface ClassicGasPriceProps {
  gasPrice: string;
}

export function assignGasPrice<
  T extends Partial<
    Pick<
      IncomingTransaction,
      keyof ClassicGasPriceProps | keyof EIP1559Props | 'type'
    >
  >
>(
  transaction: T,
  gasPrice: GasPriceObject
): T & (ClassicGasPriceProps | EIP1559Props) {
  if (gasPrice.eip1559) {
    const { eip1559 } = gasPrice;
    delete transaction.gasPrice;
    return Object.assign(transaction, {
      maxFeePerGas: ethers.utils.hexValue(eip1559.max_fee),
      maxPriorityFeePerGas: ethers.utils.hexValue(eip1559.priority_fee),
    });
  } else if (gasPrice.classic != null) {
    delete transaction.maxFeePerGas;
    delete transaction.maxPriorityFeePerGas;
    delete transaction.type;
    return Object.assign(transaction, {
      gasPrice: ethers.utils.hexValue(gasPrice.classic),
    });
  }
  throw new Error(
    'gasPrice object must include either classic or eip1559 field'
  );
}

export function assignChainGasPrice<T extends object>(
  transaction: T,
  chainGasPrice: ChainGasPrice
) {
  const { eip1559, classic } = chainGasPrice.info;
  return assignGasPrice(transaction, {
    eip1559: eip1559?.fast,
    classic: classic?.fast,
  });
}

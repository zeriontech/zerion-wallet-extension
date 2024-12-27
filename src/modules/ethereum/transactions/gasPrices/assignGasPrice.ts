import { ethers } from 'ethers';
import type { IncomingTransaction } from '../../types/IncomingTransaction';
import type { GasPriceObject } from './GasPriceObject';

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
  // Prefer non-zero number for "classic", but prefer zero over nullish:
  const classicGasPrices =
    gasPrice.classic ||
    gasPrice.optimistic?.underlying.classic ||
    (gasPrice.classic ?? gasPrice.optimistic?.underlying.classic);

  const eip1559GasPrices =
    gasPrice.eip1559 || gasPrice.optimistic?.underlying.eip1559;
  if (eip1559GasPrices) {
    delete transaction.gasPrice;
    return Object.assign(transaction, {
      maxFeePerGas: ethers.toQuantity(eip1559GasPrices.maxFee),
      maxPriorityFeePerGas: ethers.toQuantity(eip1559GasPrices.priorityFee),
    });
  } else if (classicGasPrices != null) {
    delete transaction.maxFeePerGas;
    delete transaction.maxPriorityFeePerGas;
    delete transaction.type;
    return Object.assign(transaction, {
      gasPrice: ethers.toQuantity(classicGasPrices),
    });
  }
  throw new Error(
    'gasPrice object must include either classic or eip1559 field'
  );
}

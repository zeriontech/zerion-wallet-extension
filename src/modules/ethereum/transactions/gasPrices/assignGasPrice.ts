import { ethers } from 'ethers';
import { GasPriceObject } from './GasPriceObject';

interface EIP1559Props {
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
}

interface ClassicGasPriceProps {
  gasPrice: string;
}

export function assignGasPrice<T extends object>(
  transaction: T,
  gasPrice: GasPriceObject
): T & (ClassicGasPriceProps | EIP1559Props) {
  if (gasPrice.eip1559) {
    const { eip1559 } = gasPrice;
    return Object.assign(transaction, {
      maxFeePerGas: ethers.utils.hexValue(eip1559.max_fee),
      maxPriorityFeePerGas: ethers.utils.hexValue(eip1559.priority_fee),
    });
  } else if (gasPrice.classic != null) {
    return Object.assign(transaction, {
      gasPrice: ethers.utils.hexValue(gasPrice.classic),
    });
  }
  throw new Error(
    'gasPrice object must include either classic or eip1559 field'
  );
}

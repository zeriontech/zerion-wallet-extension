import type { BigNumberish } from 'ethers';
import type { IncomingTransaction } from '../../types/IncomingTransaction';

function isNotEmpty(value: null | undefined | string | number | BigNumberish) {
  return value != null && value !== '';
}

function hasEIP1559GasPrice(tx: Partial<IncomingTransaction>) {
  return isNotEmpty(tx.maxFeePerGas) && isNotEmpty(tx.maxPriorityFeePerGas);
}

function hasClassicGasPrice(tx: Partial<IncomingTransaction>) {
  return isNotEmpty(tx.gasPrice);
}

export function hasGasPrice(tx: Partial<IncomingTransaction>) {
  return hasEIP1559GasPrice(tx) || hasClassicGasPrice(tx);
}

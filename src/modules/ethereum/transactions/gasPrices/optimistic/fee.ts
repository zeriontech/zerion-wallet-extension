import { ethers } from 'ethers';
import RLP from 'rlp';
import type { OptimisticGasPriceInfo } from '../requests';
import { getGas } from '../../getGas';

interface Transaction {
  data?: string;
  to?: string;
  gas?: string;
  gasLimit?: string;
  gasPrice?: string;
  maxPriorityFeePerGas?: string;
  maxFeePerGas?: string;
  value?: string | number;
}

function bufferToHex(buffer: Uint8Array) {
  return Array.from(buffer)
    .map((x) => x.toString(16).padStart(2, '0'))
    .join('');
}

function bytesLength(str: string) {
  return ethers.utils.arrayify(str).length;
}

function countZeroBytes(str: string) {
  return str.match(/(00)/g)?.length ?? 0;
}

function rlpEncode(values: (string | number)[]) {
  const encoded = RLP.encode(values);
  return `0x${bufferToHex(encoded)}`;
}

interface OptimisticFee {
  maxFee: number;
  estimatedFee: number;
}

export async function createOptimisticFee({
  optimisticGasPriceInfo,
  transaction,
  getNonce,
}: {
  optimisticGasPriceInfo: OptimisticGasPriceInfo;
  transaction: Transaction;
  getNonce: () => Promise<number>;
}): Promise<OptimisticFee | null> {
  const { l1, fixed_overhead, dynamic_overhead } = optimisticGasPriceInfo;
  if (l1 == null || fixed_overhead == null || dynamic_overhead == null) {
    return null;
  }
  const gas = getGas(transaction) as string;
  const {
    to = '0x',
    value = '0x0',
    data = '0x',
    gasPrice,
    maxFeePerGas,
    maxPriorityFeePerGas,
  } = transaction;
  if (gas == null) {
    return null;
  }

  const nonce = await getNonce();
  const encoded_tx_data =
    maxPriorityFeePerGas != null && maxFeePerGas != null
      ? rlpEncode([
          nonce,
          gas,
          to,
          value,
          data,
          maxPriorityFeePerGas,
          maxFeePerGas,
        ])
      : gasPrice != null
      ? rlpEncode([nonce, gasPrice, gas, to, value, data])
      : null;
  if (encoded_tx_data == null) {
    return null;
  }
  const zero_tx_bytes_number = countZeroBytes(encoded_tx_data); // number of zero bytes (!), i.e. '00' substring in encoded tx.
  const non_zero_tx_bytes_number =
    bytesLength(encoded_tx_data) - zero_tx_bytes_number; // len is a number of bytes (!) in encoded tx.

  const tx_data_gas =
    zero_tx_bytes_number * 4 + non_zero_tx_bytes_number * 16 + 68 * 16;
  const l1GasEstimation =
    ((tx_data_gas + fixed_overhead) * dynamic_overhead) / 1000000;

  const l1_fee_est = Math.round(l1 * l1GasEstimation);
  return {
    maxFee:
      (maxFeePerGas ? Number(maxFeePerGas) : Number(gasPrice)) * Number(gas) +
      Math.round(l1_fee_est * 1.25), // Optimism guarantees that there should not be one-time jumps of l1 component of gas estimation more than 25%
    estimatedFee:
      (maxFeePerGas ? Number(maxFeePerGas) : Number(gasPrice)) * Number(gas) +
      l1_fee_est,
  };
}

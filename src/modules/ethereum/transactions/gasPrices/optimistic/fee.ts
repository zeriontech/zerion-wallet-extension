import { ethers } from 'ethers';
import RLP from 'rlp';
import type { IncomingTransaction } from 'src/modules/ethereum/types/IncomingTransaction';
import { valueToHex } from 'src/shared/units/valueToHex';
import type { ChainGasPrice } from '../types';
import type { GasPriceObject } from '../GasPriceObject';

function bufferToHex(buffer: Uint8Array) {
  return Array.from(buffer)
    .map((x) => x.toString(16).padStart(2, '0'))
    .join('');
}

function bytesLength(str: string) {
  return ethers.getBytes(str).length;
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
  gasPriceInfo,
  transaction,
  gasLimit,
  getNonce,
  gasPriceObject,
}: {
  gasPriceInfo: ChainGasPrice['fast'];
  gasLimit: string | number;
  transaction: IncomingTransaction;
  gasPriceObject: GasPriceObject | null;
  getNonce: () => Promise<number>;
}): Promise<OptimisticFee | null> {
  const { optimistic } = gasPriceInfo;
  if (!optimistic) {
    return null;
  }
  const { fixedOverhead, dynamicOverhead } = optimistic;
  if (gasLimit == null) {
    return null;
  }

  const to = transaction.to ?? '0x';
  const value = transaction.value ?? '0x';
  const data = transaction.data ?? '0x';

  const baseFee = optimistic.underlying.eip1559?.baseFee;
  const eip1559GasPrice =
    gasPriceObject?.eip1559 || optimistic.underlying.eip1559;
  const classicGasPrice =
    gasPriceObject?.classic || optimistic.underlying.classic;

  const nonce = await getNonce();
  const encoded_tx_data = eip1559GasPrice
    ? rlpEncode([
        nonce,
        eip1559GasPrice.priorityFee,
        eip1559GasPrice.maxFee,
        gasLimit,
        to,
        valueToHex(value),
        data,
      ])
    : classicGasPrice != null
    ? rlpEncode([nonce, classicGasPrice, gasLimit, to, valueToHex(value), data])
    : null;
  if (encoded_tx_data == null) {
    return null;
  }
  const zero_tx_bytes_number = countZeroBytes(encoded_tx_data); // number of zero bytes (!), i.e. '00' substring in encoded tx.
  const non_zero_tx_bytes_number =
    bytesLength(encoded_tx_data) - zero_tx_bytes_number; // len is a number of bytes (!) in encoded tx.

  const tx_data_gas = zero_tx_bytes_number * 4 + non_zero_tx_bytes_number * 16;
  const l1GasEstimation = (tx_data_gas + fixedOverhead) * dynamicOverhead;

  return {
    maxFee:
      (eip1559GasPrice
        ? Number(eip1559GasPrice.maxFee)
        : Number(classicGasPrice)) *
        Number(gasLimit) +
      Math.round(l1GasEstimation * 1.25), // Optimism guarantees that there should not be one-time jumps of l1 component of gas estimation more than 25%
    estimatedFee:
      (eip1559GasPrice
        ? Math.min(
            Number(eip1559GasPrice.maxFee),
            Number(baseFee) + Number(eip1559GasPrice.priorityFee)
          )
        : Number(classicGasPrice)) *
        Number(gasLimit) +
      Math.round(l1GasEstimation),
  };
}

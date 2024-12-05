/**
 * These type descriptions are copied literally from ethers@v5
 * We need to preserve them because we used these values for persistence
 */
import { BigNumber as EthersV5BigNumber } from '@ethersproject/bignumber';
import type { ethers } from 'ethers';
import type { TransactionResponsePlain } from 'src/modules/ethereum/types/TransactionResponsePlain';

// type EthersV5AccessList = Array<{
//   address: string;
//   storageKeys: Array<string>;
// }>;

interface EthersV5Transaction {
  hash?: string;

  to?: string;
  from?: string;
  nonce: number;

  gasLimit: EthersV5BigNumber | string; // TODO: | string?
  gasPrice?: EthersV5BigNumber | string;

  data: string;
  value: EthersV5BigNumber | string;
  chainId: number;

  r?: string;
  s?: string;
  v?: number;

  // Typed-Transaction features
  type?: number | null;

  // // EIP-2930; Type 1 & EIP-1559; Type 2
  // accessList?: EthersV5AccessList;

  // EIP-1559; Type 2
  maxPriorityFeePerGas?: EthersV5BigNumber | string;
  maxFeePerGas?: EthersV5BigNumber | string;
}
export interface EthersV5TransactionResponse extends EthersV5Transaction {
  hash: string;

  // Only if a transaction has been mined
  blockNumber?: number;
  blockHash?: string;
  // timestamp?: number;

  // confirmations: number;

  // Not optional (as it is in Transaction)
  from: string;

  // The raw transaction
  raw?: string;
}

function fromEthersBigNumber(
  x: EthersV5BigNumber | number | string | bigint | null | undefined
) {
  if (x == null) {
    return null;
  }
  if (EthersV5BigNumber.isBigNumber(x)) {
    return BigInt(EthersV5BigNumber.from(x).toHexString());
  } else {
    return BigInt(x);
  }
}

export function v5ToPlainTransactionResponse(
  value: EthersV5TransactionResponse
): TransactionResponsePlain {
  return {
    blockHash: value.blockHash ?? null,
    blockNumber: value.blockNumber ?? null,
    chainId: BigInt(value.chainId),
    data: value.data,
    from: value.from,
    gasLimit: fromEthersBigNumber(value.gasLimit) ?? 0n,
    gasPrice: fromEthersBigNumber(value.gasPrice) ?? 0n,
    hash: value.hash,
    index: 0 /** Not sure? */,
    maxFeePerBlobGas: null,
    maxFeePerGas: fromEthersBigNumber(value.maxFeePerGas),
    maxPriorityFeePerGas: fromEthersBigNumber(value.maxPriorityFeePerGas),
    nonce: value.nonce,
    to: value.to ?? null,
    type: value.type ?? 0,
    value: fromEthersBigNumber(value.value) ?? 0n,
  };
}

export function toEthersV5TransactionResponse(
  value: ethers.TransactionResponse
): EthersV5TransactionResponse {
  return {
    chainId: Number(value.chainId),
    data: value.data,
    from: value.from,
    to: value.to ?? undefined,
    gasLimit: value.gasLimit.toString(),
    hash: value.hash,
    nonce: value.nonce,
    value: value.value.toString(),
    blockHash: value.blockHash ?? undefined,
    blockNumber: value.blockNumber ?? undefined,
    gasPrice: value.gasPrice.toString(),
    maxFeePerGas: value.maxFeePerGas?.toString(),
    maxPriorityFeePerGas: value.maxPriorityFeePerGas?.toString(),
    type: value.type,
  };
}

export interface EthersV5TransactionReceiptStripped {
  to: string;
  from: string;
  contractAddress: string;
  // transactionIndex: number;
  // logsBloom: string;
  blockHash: string;
  transactionHash: string;
  blockNumber: number;
  // confirmations: number;
  // byzantium: boolean;
  type: number;
  status?: number;
}

export function toEthersV5Receipt(
  value: ethers.TransactionReceipt
): EthersV5TransactionReceiptStripped {
  return {
    blockHash: value.blockHash,
    blockNumber: value.blockNumber,
    // confirmations: value.confirmations,
    contractAddress: value.contractAddress ?? '0x',
    from: value.from,
    to: value.to ?? '',
    transactionHash: value.hash,
    type: value.type,
    status: value.status ?? undefined,
  };
}

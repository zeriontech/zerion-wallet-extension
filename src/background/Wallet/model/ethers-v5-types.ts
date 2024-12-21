/**
 * These type descriptions are copied literally from ethers@v5
 * We need to preserve them because we used these values for persistence
 */
import { BigNumber as EthersV5BigNumber } from '@ethersproject/bignumber';
import type { ethers } from 'ethers';
import type { TransactionResponsePlain } from 'src/modules/ethereum/types/TransactionResponsePlain';
import { invariant } from 'src/shared/invariant';
import type { PartiallyOptional } from 'src/shared/type-utils/PartiallyOptional';
import { valueToHex } from 'src/shared/units/valueToHex';

// type EthersV5AccessList = Array<{
//   address: string;
//   storageKeys: Array<string>;
// }>;

interface EthersV5Transaction {
  hash?: string;

  to?: string;
  from?: string;
  nonce: EthersV5BigNumber | number;

  gasLimit: EthersV5BigNumber | string; // TODO: | string?
  gasPrice?: EthersV5BigNumber | string;

  data: string;
  value: EthersV5BigNumber | string;
  chainId: EthersV5BigNumber | number;

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
    chainId: valueToHex(fromEthersBigNumber(value.chainId) ?? 'never'),
    data: value.data,
    from: value.from,
    gasLimit: (fromEthersBigNumber(value.gasLimit) ?? 0n).toString(),
    gasPrice: (fromEthersBigNumber(value.gasPrice) ?? 0n).toString(),
    hash: value.hash,
    index: 0 /** Not sure? */,
    maxFeePerBlobGas: null,
    maxFeePerGas: fromEthersBigNumber(value.maxFeePerGas)?.toString() ?? null,
    maxPriorityFeePerGas:
      fromEthersBigNumber(value.maxPriorityFeePerGas)?.toString() ?? null,
    nonce: Number(fromEthersBigNumber(value.nonce) ?? 0),
    to: value.to ?? null,
    type: value.type ?? 0,
    value: (fromEthersBigNumber(value.value) ?? 0n).toString(),
  };
}

export function toPlainTransactionResponse(
  value: PartiallyOptional<ethers.TransactionResponse, 'gasPrice' | 'signature'>
): TransactionResponsePlain {
  return {
    blockHash: value.blockHash,
    blockNumber: value.blockNumber,
    chainId: valueToHex(value.chainId),
    data: value.data,
    from: value.from,
    gasLimit: value.gasLimit.toString(),
    gasPrice: value.gasPrice?.toString() ?? null,
    hash: value.hash,
    index: value.index,
    maxFeePerBlobGas: value.maxFeePerBlobGas?.toString() ?? null,
    maxFeePerGas: value.maxFeePerGas?.toString() ?? null,
    maxPriorityFeePerGas: value.maxPriorityFeePerGas?.toString() ?? null,
    nonce: value.nonce,
    to: value.to,
    type: value.type,
    value: value.value.toString(),
  };
}

export function toEthersV5TransactionResponse(
  /**
   * Can't trust TransactionResponse type because zksync-ethers is buggy:
   * https://github.com/zksync-sdk/zksync-ethers/issues/224
   */
  value: Partial<ethers.TransactionResponse>
): EthersV5TransactionResponse {
  invariant(value.chainId, 'chainId is required');
  invariant(value.from, 'from is required');
  invariant(value.hash, 'hash is required');
  invariant(value.nonce, 'nonce is required');
  return {
    chainId: Number(value.chainId),
    data: value.data || '',
    from: value.from,
    to: value.to ?? undefined,
    gasLimit: value.gasLimit?.toString() ?? '0',
    hash: value.hash,
    nonce: value.nonce,
    value: value.value?.toString() ?? '0',
    blockHash: value.blockHash ?? undefined,
    blockNumber: value.blockNumber ?? undefined,
    gasPrice: value.gasPrice?.toString(),
    maxFeePerGas: value.maxFeePerGas?.toString(),
    maxPriorityFeePerGas: value.maxPriorityFeePerGas?.toString(),
    type: value.type,
  };
}
Object.assign(globalThis, {
  toEthersV5TransactionResponse,
  v5ToPlainTransactionResponse,
  toPlainTransactionResponse,
});

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

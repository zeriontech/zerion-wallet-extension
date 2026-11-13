/**
 * EthersV5* types descriptions are copied literally from ethers@v5
 * We need to preserve them because we used these values for persistence
 */
import {
  isLegacyBigNumber,
  legacyBigNumberToStoredHex,
  toLegacyBigNumber,
  type LegacyBigNumber,
} from 'src/shared/units/legacyBigNumber';
import type { ethers } from 'ethers';
import type { SerializableTransactionResponse } from 'src/modules/ethereum/types/TransactionResponsePlain';
import type { PartiallyOptional } from 'src/shared/type-utils/PartiallyOptional';
import { valueToHex } from 'src/shared/units/valueToHex';

// Actual sample from storage:
//  {
//     "chainId": { "_hex": "0x0849ea", "_isBigNumber": true },
//     "confirmations": 0,
//     "customData": {
//         "factoryDeps": [],
//         "gasPerPubdata": { "_hex": "0xc350", "_isBigNumber": true },
//         "paymasterParams": {
//             "paymaster": "0x4667fFb6a24017f977c93Da1BD630CF1801343b6"
//         }
//     },
//     "data": "0x83d13.....",
//     "from": "0x42b9dF65B219B3dD36FF330A4dD8f327A6Ada990",
//     "gasLimit": { "_hex": "0x0c29b9", "_isBigNumber": true },
//     "hash": "0xa72edd8e33a675cc9e5d4e719f0e084d7f3bc756bc2a7cd7e9e17675a7a4c5ef",
//     "maxFeePerGas": { "_hex": "0x0564eba0", "_isBigNumber": true },
//     "maxPriorityFeePerGas": { "_hex": "0x00", "_isBigNumber": true },
//     "nonce": 158,
//     "to": "0xe4C82643A4F9Fd288322cc6fBd7C48AB068B38D3",
//     "type": 113,
//     "value": { "_hex": "0x00", "_isBigNumber": true }
// }
//
/** This is a partial type of ethers@v5 Transaction. I removed typed that we're not explicitly using in code */
interface EthersV5Transaction {
  hash?: string;

  to?: string;
  from?: string;
  /** Can it be `number | EthersV5BigNumber`? */
  nonce: number;

  gasLimit: LegacyBigNumber | string;
  gasPrice?: LegacyBigNumber | string;

  data: string;
  value: LegacyBigNumber | string;
  // Even though chainId is typed as `number` in ethers@v5: https://github.com/ethers-io/ethers.js/blob/0bfa7f497dc5793b66df7adfb42c6b846c51d794/packages/transactions/src.ts/index.ts#L66
  // It can actually be BigNumberish (see actual storage sample above)
  chainId: LegacyBigNumber | number;

  r?: string;
  s?: string;
  v?: number;

  // Typed-Transaction features
  type?: number | null;

  // EIP-1559; Type 2
  maxPriorityFeePerGas?: LegacyBigNumber | string;
  maxFeePerGas?: LegacyBigNumber | string;
}

export interface EthersV5TransactionResponse extends EthersV5Transaction {
  hash: string;

  // Only if a transaction has been mined
  blockNumber?: number;
  blockHash?: string;

  // Not optional (as it is in Transaction)
  from: string;

  // The raw transaction
  raw?: string;
}

function fromEthersBigNumber(x: LegacyBigNumber | number | string | bigint | null | undefined) {
  if (x == null) {
    return null;
  }
  return isLegacyBigNumber(x) ? BigInt(legacyBigNumberToStoredHex(x)) : BigInt(x);
}

export function v5ToPlainTransactionResponse(
  value: EthersV5TransactionResponse,
): SerializableTransactionResponse {
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
    maxPriorityFeePerGas: fromEthersBigNumber(value.maxPriorityFeePerGas)?.toString() ?? null,
    nonce: Number(fromEthersBigNumber(value.nonce) ?? 0),
    to: value.to ?? null,
    type: value.type ?? 0,
    value: (fromEthersBigNumber(value.value) ?? 0n).toString(),
  };
}

export function toPlainTransactionResponse(
  value: PartiallyOptional<ethers.TransactionResponse, 'gasPrice' | 'signature'>,
): SerializableTransactionResponse {
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

export function txPlainToEthersV5TransactionResponse(
  value: SerializableTransactionResponse,
): EthersV5TransactionResponse {
  return {
    chainId: toLegacyBigNumber(value.chainId),
    data: value.data,
    from: value.from,
    gasLimit: value.gasLimit,
    hash: value.hash,
    nonce: value.nonce,
    value: value.value,
    blockHash: value.blockHash ?? undefined,
    blockNumber: value.blockNumber ?? undefined,
    gasPrice: value.gasPrice ?? undefined,
    maxFeePerGas: value.maxFeePerGas ?? undefined,
    maxPriorityFeePerGas: value.maxPriorityFeePerGas ?? undefined,
    to: value.to ?? undefined,
    type: value.type,
  };
}

export interface EthersV5TransactionReceiptStripped {
  to: string;
  from: string;
  contractAddress: string;
  blockHash: string;
  transactionHash: string;
  blockNumber: number;
  type: number;
  status?: number;
}

export function toEthersV5Receipt(
  value: ethers.TransactionReceipt,
): EthersV5TransactionReceiptStripped {
  return {
    blockHash: value.blockHash,
    blockNumber: value.blockNumber,
    contractAddress: value.contractAddress ?? '0x',
    from: value.from,
    to: value.to ?? '',
    transactionHash: value.hash,
    type: value.type,
    status: value.status ?? undefined,
  };
}

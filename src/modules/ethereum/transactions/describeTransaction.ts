import BigNumber from 'bignumber.js';
import { ethers } from 'ethers';
import type { Chain } from 'src/modules/networks/Chain';
import type { Networks } from 'src/modules/networks/Networks';
import type { IncomingTransaction } from '../types/IncomingTransaction';

export type TransactionActionType = 'deploy' | 'send' | 'execute' | 'approve';

interface OutgoingValue {
  isNativeAsset: boolean;
  chain: Chain;
  assetId: string | null;
  assetAddress: string | null;
  amount?: string;
}

export type TransactionAction = OutgoingValue &
  (
    | {
        type: 'send';
        receiverAddress: string;
        contractAddress?: string;
        amount: string;
      }
    | {
        type: 'execute';
        contractAddress: string;
      }
    | {
        type: 'approve';
        spenderAddress: string;
        contractAddress: string;
        amount: string;
      }
  );

interface DescriberContext {
  chain: Chain;
  networks: Networks;
}

/**
 * Avoids scientific notation, e.g. 0.00000000000000000000000002 –> '0.00000000000000000000000002'
 * NOT '2e-26'
 */
function amountToString(value: number | string | bigint): string {
  const n = typeof value === 'bigint' ? String(value) : value;
  return new BigNumber(n).toFixed();
}

function getMaybeAmount(transaction: IncomingTransaction) {
  return transaction.value ? amountToString(transaction.value) : undefined;
}

function sliceSelector(data: string) {
  try {
    /**
     * ethers throws error if data is less than 4 bytes. We could
     * check bytes length before trying to slice, but because this is
     * a local helper to match against known selectors, we don't need to crash
     * for other invalid arguments. It's okay to return data as is if we can't slice
     */
    return ethers.dataSlice(data, 0, 4);
  } catch {
    return data;
  }
}

function sliceArguments(data: string) {
  return ethers.dataSlice(data, 4);
}

function matchSelectors(transaction: IncomingTransaction, selectors: string[]) {
  const { data } = transaction;
  if (
    !transaction.to ||
    data == null ||
    data === '' ||
    ethers.toQuantity(data) === '0x0'
  ) {
    return null;
  }
  const selector = sliceSelector(data);
  if (!selectors.some((s) => s === selector)) {
    return null;
  }
  const args = sliceArguments(data);
  return {
    selector,
    args,
  };
}

function encodeSelector(signature: string) {
  return ethers.dataSlice(
    ethers.keccak256(ethers.toUtf8Bytes(signature)),
    0,
    4
  );
}

const selectors = {
  // ERC20
  approve: encodeSelector('approve(address,uint256)'),
  transfer: encodeSelector('transfer(address,uint256)'),
  // Multicall
  multicall1: encodeSelector('multicall(bytes[])'),
  multicall2: encodeSelector('multicall(uint256,bytes[])'),
  multicall3: encodeSelector('invoke(bytes32[],bytes[])'),
  // ERC-777
  send: encodeSelector('send(address,uint256,bytes)'),
};

const abiCoder = ethers.AbiCoder.defaultAbiCoder();

function createExecuteAction(
  transaction: IncomingTransaction,
  context: DescriberContext
): TransactionAction {
  const network = context.networks.getNetworkByName(context.chain);
  return {
    type: 'execute',
    isNativeAsset: true,
    contractAddress: transaction.to || '0x',
    amount: getMaybeAmount(transaction),
    assetId: network?.native_asset?.id || null,
    assetAddress: network?.native_asset?.address || null,
    chain: context.chain,
  };
}

function describeMulticall(
  transaction: IncomingTransaction,
  context: DescriberContext
): TransactionAction | null {
  const match = matchSelectors(transaction, [
    selectors.multicall1,
    selectors.multicall2,
    selectors.multicall3,
  ]);
  if (!match) {
    return null;
  }

  return createExecuteAction(transaction, context);
}

export function parseApprove<T extends IncomingTransaction>(transaction: T) {
  const match = matchSelectors(transaction, [selectors.approve]);
  if (!match) {
    return null;
  }
  const { args } = match;
  const [spenderAddress, amount] = abiCoder.decode(
    ['address', 'uint256'],
    args
  );
  const contractAddress = transaction.to || '0x';
  return {
    type: 'approve' as const,
    contractAddress,
    spenderAddress,
    amount: amountToString(amount as number | bigint),
    isNativeAsset: true,
    assetAddress: contractAddress,
  };
}

function describeApprove(
  transaction: IncomingTransaction,
  context: DescriberContext
): TransactionAction | null {
  const result = parseApprove(transaction);
  if (!result) {
    return null;
  }
  const network = context.networks.getByNetworkId(context.chain);
  return {
    ...result,
    chain: context.chain,
    assetId: network?.native_asset?.id || null,
  };
}

function describeSend(
  transaction: IncomingTransaction,
  context: DescriberContext
): TransactionAction | null {
  // native token send
  if (
    (transaction.data == null || transaction.data == '0x') &&
    transaction.to
  ) {
    const network = context.networks.getNetworkByName(context.chain);

    return {
      type: 'send',
      isNativeAsset: true,
      chain: context.chain,
      assetId: network?.native_asset?.id || null,
      assetAddress: network?.native_asset?.address || null,
      receiverAddress: transaction.to,
      amount: amountToString(transaction.value ?? '0'),
    };
  }

  // non-native token send
  const match = matchSelectors(transaction, [
    selectors.send,
    selectors.transfer,
  ]);
  if (!match) {
    return null;
  }
  const { selector, args } = match;

  let receiverAddress = null;
  let amount = null;

  if (selector === selectors.transfer) {
    [receiverAddress, amount] = abiCoder.decode(['address', 'uint256'], args);
  } else if (selector === selectors.send) {
    [receiverAddress, amount] = abiCoder.decode(
      ['address', 'uint256', 'bytes'],
      args
    );
  }

  const contractAddress = transaction.to || '0x';

  return {
    type: 'send',
    isNativeAsset: false,
    chain: context.chain,
    contractAddress,
    assetId: null,
    assetAddress: contractAddress,
    receiverAddress,
    amount: amountToString(amount),
  };
}

const describers = [describeApprove, describeSend, describeMulticall];

export function describeTransaction(
  transaction: IncomingTransaction,
  context: DescriberContext
): TransactionAction {
  for (const describer of describers) {
    const description = describer(transaction, context);
    if (description) {
      return description;
    }
  }

  return createExecuteAction(transaction, context);
}

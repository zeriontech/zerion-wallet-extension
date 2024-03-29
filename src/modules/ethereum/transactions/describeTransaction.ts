import type BigNumber from 'bignumber.js';
import { ethers } from 'ethers';
import type { Chain } from 'src/modules/networks/Chain';
import type { Networks } from 'src/modules/networks/Networks';
import { toNumber } from 'src/shared/units/toNumber';
import type { IncomingTransaction } from '../types/IncomingTransaction';

export type TransactionActionType = 'deploy' | 'send' | 'execute' | 'approve';

interface OutgoingValue {
  isNativeAsset: boolean;
  chain: Chain;
  assetId: string | null;
  assetAddress: string | null;
  amount?: number;
}

export type TransactionAction = OutgoingValue &
  (
    | {
        type: 'send';
        receiverAddress: string;
        contractAddress?: string;
        amount: number;
      }
    | {
        type: 'execute';
        contractAddress: string;
      }
    | {
        type: 'approve';
        spenderAddress: string;
        contractAddress: string;
        amount: number;
      }
  );

interface DescriberContext {
  chain: Chain;
  networks: Networks;
}

function amountToNumber(value: BigNumber.Value = 0) {
  return toNumber(value);
}

function getMaybeAmount(transaction: IncomingTransaction) {
  return transaction.value
    ? amountToNumber(transaction.value.toString())
    : undefined;
}

function sliceSelector(data: ethers.utils.BytesLike) {
  return ethers.utils.hexDataSlice(data, 0, 4);
}

function sliceArguments(data: ethers.utils.BytesLike) {
  return ethers.utils.hexDataSlice(data, 4);
}

function matchSelectors(transaction: IncomingTransaction, selectors: string[]) {
  if (!transaction.data || !transaction.to) {
    return null;
  }
  const selector = sliceSelector(transaction.data);
  if (!selectors.some((s) => s === selector)) {
    return null;
  }
  const args = sliceArguments(transaction.data);
  return {
    selector,
    args,
  };
}

function encodeSelector(signature: string) {
  return ethers.utils.hexDataSlice(
    ethers.utils.keccak256(ethers.utils.toUtf8Bytes(signature)),
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

const abiCoder = ethers.utils.defaultAbiCoder;

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

function describeApprove(
  transaction: IncomingTransaction,
  context: DescriberContext
): TransactionAction | null {
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
  const network = context.networks.getNetworkByName(context.chain);
  return {
    type: 'approve',
    contractAddress,
    spenderAddress,
    amount: amount,
    isNativeAsset: true,
    chain: context.chain,
    assetAddress: contractAddress,
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
      amount: amountToNumber(transaction.value?.toString()),
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
    amount: amountToNumber(amount),
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

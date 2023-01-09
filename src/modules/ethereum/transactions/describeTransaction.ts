import { ethers } from 'ethers';
import { Networks } from 'src/modules/networks/Networks';
import { networksStore } from 'src/modules/networks/networks-store';
import type { IncomingTransaction } from '../types/IncomingTransaction';
import { ensureChainId } from './getChainId';

export enum TransactionAction {
  multicall,
  approve,
  swap,
  transfer,
  deposit,
  withdraw,
  setApprovalForAll,
  send,
  contractInteraction,
}

export interface TransactionDescription {
  action: TransactionAction;
  approveAssetCode?: string;
  approveAmount?: string;
  tokenSpender?: string;
  assetReceiver?: string;
  sendAssetCode?: string;
  sendAssetId?: string;
  sendAmount?: string;
  isNativeSend?: boolean;
  depositAmount?: string;
  withdrawAmount?: string;
  contractAddress?: string;
}

const encodeSelector = (signature: string) =>
  ethers.utils.hexDataSlice(
    ethers.utils.keccak256(ethers.utils.toUtf8Bytes(signature)),
    0,
    4
  );

const selectors = {
  // Native, ERC20
  approve: encodeSelector('approve(address,uint256)'),
  transfer: encodeSelector('transfer(address,uint256)'),
  // Common
  multicall1: encodeSelector('multicall(bytes[])'),
  multicall2: encodeSelector('multicall(uint256,bytes[])'),
  // ERC-4626 (Vault)
  deposit: encodeSelector('deposit(uint256,address)'),
  withdraw: encodeSelector('withdraw(assets,address,address)'),
  // ERC-1155 (Multi-token)
  setApprovalForAll: encodeSelector('setApprovalForAll(address,bool)'),
  // ERC-777
  send: encodeSelector('send(address,uint256,bytes)'),
};

function describeDeposit(
  transaction: IncomingTransaction
): TransactionDescription | null {
  if (!transaction.data) {
    return null;
  }
  const selector = ethers.utils.hexDataSlice(transaction.data, 0, 4);

  if (selector === selectors.deposit) {
    const abiCoder = new ethers.utils.AbiCoder();
    const [assets, receiver] = abiCoder.decode(
      ['uint256', 'address'],
      ethers.utils.hexDataSlice(transaction.data, 4)
    );

    return {
      action: TransactionAction.deposit,
      contractAddress: transaction.to,
      assetReceiver: receiver,
      depositAmount: assets,
    };
  }
  return null;
}

function describeWithdraw(
  transaction: IncomingTransaction
): TransactionDescription | null {
  if (!transaction.data) {
    return null;
  }
  const selector = ethers.utils.hexDataSlice(transaction.data, 0, 4);

  if (selector === selectors.withdraw) {
    const abiCoder = new ethers.utils.AbiCoder();
    const [assets, receiver, _owner] = abiCoder.decode(
      ['assets', 'address', 'address'],
      ethers.utils.hexDataSlice(transaction.data, 4)
    );

    return {
      action: TransactionAction.withdraw,
      contractAddress: transaction.to,
      withdrawAmount: assets,
      assetReceiver: receiver,
    };
  }
  return null;
}

function describeSetApprovalForAll(
  transaction: IncomingTransaction
): TransactionDescription | null {
  if (!transaction.data) {
    return null;
  }
  const selector = ethers.utils.hexDataSlice(transaction.data, 0, 4);

  if (selector === selectors.setApprovalForAll) {
    const abiCoder = new ethers.utils.AbiCoder();
    const [operator, _approved] = abiCoder.decode(
      ['assets', 'bool'],
      ethers.utils.hexDataSlice(transaction.data, 4)
    );

    return {
      action: TransactionAction.setApprovalForAll,
      approveAssetCode: transaction.to,
      tokenSpender: operator,
    };
  }
  return null;
}

function describeMulticall(
  transaction: IncomingTransaction
): TransactionDescription | null {
  if (!transaction.data) {
    return null;
  }
  const selector = ethers.utils.hexDataSlice(transaction.data, 0, 4);

  if (selector === selectors.multicall1 || selector === selectors.multicall2) {
    return {
      action: TransactionAction.multicall,
      contractAddress: transaction.to,
    };
  }
  return null;
}

function describeApprove(
  transaction: IncomingTransaction
): TransactionDescription | null {
  if (!transaction.data) {
    return null;
  }
  const selector = ethers.utils.hexDataSlice(transaction.data, 0, 4);

  if (selector === selectors.approve) {
    const abiCoder = new ethers.utils.AbiCoder();
    const [address, amount] = abiCoder.decode(
      ['address', 'uint256'],
      ethers.utils.hexDataSlice(transaction.data, 4)
    );

    return {
      action: TransactionAction.approve,
      approveAssetCode: transaction.to,
      approveAmount: amount,
      tokenSpender: address,
    };
  }
  return null;
}

function describeSend(
  transaction: IncomingTransaction,
  networks: Networks
): TransactionDescription | null {
  if (transaction.data == null || transaction.data == '0x') {
    // native token send
    const chainId = ensureChainId(transaction);
    const network = networks.getNetworkById(chainId);
    return {
      action: TransactionAction.transfer,
      assetReceiver: transaction.to,
      sendAssetCode: network.native_asset?.address || undefined,
      sendAssetId: network.native_asset?.id,
      sendAmount: ethers.BigNumber.from(transaction.value || '0').toString(),
      isNativeSend: true,
    };
  }
  const selector = ethers.utils.hexDataSlice(transaction.data, 0, 4);
  if (selector !== selectors.transfer || selector !== selectors.send) {
    return null;
  }

  let address = null;
  let amount = null;

  const abiCoder = new ethers.utils.AbiCoder();
  if (selector === selectors.transfer) {
    [address, amount] = abiCoder.decode(
      ['address', 'uint256'],
      ethers.utils.hexDataSlice(transaction.data, 4)
    );
  } else if (selector === selectors.send) {
    [address, amount] = abiCoder.decode(
      ['address', 'uint256', 'bytes'],
      ethers.utils.hexDataSlice(transaction.data, 4)
    );
  }

  return {
    action: TransactionAction.transfer,
    assetReceiver: address,
    sendAssetCode: transaction.to,
    sendAmount: ethers.BigNumber.from(amount).toString(),
  };
}

function describeContractInteraction(
  transaction: IncomingTransaction
): TransactionDescription | null {
  return {
    action: TransactionAction.contractInteraction,
    contractAddress: transaction.to,
  };
}
const describers = [
  describeApprove,
  describeSend,
  describeDeposit,
  describeWithdraw,
  describeSetApprovalForAll,
  describeMulticall,
  describeContractInteraction,
];

export async function describeTransaction(
  transaction: IncomingTransaction
): Promise<TransactionDescription> {
  const networks = await networksStore.load();
  for (const describer of describers) {
    const description = describer(transaction, networks);
    if (description) {
      return description;
    }
  }
  return { action: TransactionAction.contractInteraction };
}

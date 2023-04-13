import { ethers } from 'ethers';
import type { Networks } from 'src/modules/networks/Networks';
import type { IncomingTransaction } from '../types/IncomingTransaction';
import { ensureChainId } from './getChainId';

export enum TransactionAction {
  multicall,
  approve,
  swap,
  transfer,
  supply,
  deposit,
  withdraw,
  setApprovalForAll,
  stake,
  unstake,
  claim,
  mint,
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
  supplyAssetCode?: string;
  supplyAmount?: string;
  stakeAmount?: string;
  withdrawAssetCode?: string;
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
  // Vaults (ERC-4626 and others), Compound, YearnFi etc
  supplyCompound: encodeSelector('supply(address,uint256)'),
  deposit: encodeSelector('deposit(uint256,address)'),
  depositYearnFi: encodeSelector('deposit(address,address,uint256)'),
  withdraw: encodeSelector('withdraw(uint256,address,address)'),
  withdrawCompound: encodeSelector('withdraw(address,uint256)'),
  withdrawYearnFi: encodeSelector('withdraw(uint256)'),
  // Lido Finance
  submitLido: encodeSelector('submit(address)'),
  // ERC-1155 (Multi-token)
  setApprovalForAll: encodeSelector('setApprovalForAll(address,bool)'),
  // ERC-777
  send: encodeSelector('send(address,uint256,bytes)'),
};

function describeStake(
  transaction: IncomingTransaction
): TransactionDescription | null {
  if (!transaction.data) {
    return null;
  }
  const selector = ethers.utils.hexDataSlice(transaction.data, 0, 4);
  if (selector !== selectors.submitLido) {
    return null;
  }

  return {
    action: TransactionAction.stake,
    contractAddress: transaction.to,
    stakeAmount: ethers.BigNumber.from(transaction.value || '0').toString(),
  };
}

function describeSupply(
  transaction: IncomingTransaction
): TransactionDescription | null {
  if (!transaction.data) {
    return null;
  }
  const selector = ethers.utils.hexDataSlice(transaction.data, 0, 4);
  if (selector !== selectors.supplyCompound) {
    return null;
  }

  const abiCoder = new ethers.utils.AbiCoder();
  const [asset, amount] = abiCoder.decode(
    ['address', 'uint256'],
    ethers.utils.hexDataSlice(transaction.data, 4)
  );

  return {
    action: TransactionAction.supply,
    contractAddress: transaction.to,
    supplyAssetCode: asset,
    supplyAmount: ethers.BigNumber.from(amount).toString(),
  };
}

function describeDeposit(
  transaction: IncomingTransaction
): TransactionDescription | null {
  if (!transaction.data) {
    return null;
  }
  const selector = ethers.utils.hexDataSlice(transaction.data, 0, 4);
  if (selector !== selectors.deposit && selector !== selectors.depositYearnFi) {
    return null;
  }

  let assets = null;
  let receiver = null;

  const abiCoder = new ethers.utils.AbiCoder();
  if (selector === selectors.deposit) {
    [assets, receiver] = abiCoder.decode(
      ['uint256', 'address'],
      ethers.utils.hexDataSlice(transaction.data, 4)
    );
  } else if (selector === selectors.depositYearnFi) {
    [receiver, , assets] = abiCoder.decode(
      ['address', 'address', 'uint256'],
      ethers.utils.hexDataSlice(transaction.data, 4)
    );
  }

  return {
    action: TransactionAction.deposit,
    contractAddress: transaction.to,
    assetReceiver: receiver,
    depositAmount: assets,
  };
}

function describeWithdraw(
  transaction: IncomingTransaction
): TransactionDescription | null {
  if (!transaction.data) {
    return null;
  }
  const selector = ethers.utils.hexDataSlice(transaction.data, 0, 4);
  if (
    selector !== selectors.withdraw &&
    selector !== selectors.withdrawYearnFi &&
    selector !== selectors.withdrawCompound
  ) {
    return null;
  }

  let asset = null;
  let amount = null;
  let receiver = null;

  const abiCoder = new ethers.utils.AbiCoder();
  if (selector === selectors.withdraw) {
    [amount, receiver] = abiCoder.decode(
      ['uint256', 'address', 'address'],
      ethers.utils.hexDataSlice(transaction.data, 4)
    );
  } else if (selector === selectors.withdrawYearnFi) {
    [amount] = abiCoder.decode(
      ['uint256'],
      ethers.utils.hexDataSlice(transaction.data, 4)
    );
  } else if (selector === selectors.withdrawCompound) {
    [asset] = abiCoder.decode(
      ['address', 'uint256'],
      ethers.utils.hexDataSlice(transaction.data, 4)
    );
  }

  return {
    action: TransactionAction.withdraw,
    contractAddress: transaction.to,
    withdrawAmount: amount,
    withdrawAssetCode: asset,
    assetReceiver: receiver,
  };
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
      ['address', 'bool'],
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
  if (selector !== selectors.transfer && selector !== selectors.send) {
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
  describeSupply,
  describeDeposit,
  describeWithdraw,
  describeSetApprovalForAll,
  describeStake,
  describeMulticall,
  describeContractInteraction,
];

export async function describeTransaction(
  transaction: IncomingTransaction,
  networks: Networks
): Promise<TransactionDescription> {
  for (const describer of describers) {
    const description = describer(transaction, networks);
    if (description) {
      return description;
    }
  }
  return { action: TransactionAction.contractInteraction };
}

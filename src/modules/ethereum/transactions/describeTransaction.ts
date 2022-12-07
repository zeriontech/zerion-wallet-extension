import { ethers } from 'ethers';
import { Networks } from 'src/modules/networks/Networks';
import { networksStore } from 'src/modules/networks/networks-store';
import type { IncomingTransaction } from '../types/IncomingTransaction';
import { ensureChainId } from './getChainId';

export enum TransactionAction {
  approve,
  swap,
  transfer,
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
  contractAddress?: string;
}

const encodeSelector = (signature: string) =>
  ethers.utils.hexDataSlice(
    ethers.utils.keccak256(ethers.utils.toUtf8Bytes(signature)),
    0,
    4
  );
const selectors = {
  approve: encodeSelector('approve(address,uint256)'),
  transfer: encodeSelector('transfer(address,uint256)'),
};

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

  if (selector !== selectors.transfer) {
    return null;
  }
  const abiCoder = new ethers.utils.AbiCoder();
  const [address, amount] = abiCoder.decode(
    ['address', 'uint256'],
    ethers.utils.hexDataSlice(transaction.data, 4)
  );
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
const describers = [describeApprove, describeSend, describeContractInteraction];

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

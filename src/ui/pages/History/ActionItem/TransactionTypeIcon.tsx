import React from 'react';
import {
  ActionAsset,
  ActionTransfer,
  ActionType,
  AddressAction,
  PendingAction,
} from 'defi-sdk';
import { TokenIcon } from 'src/ui/ui-kit/TokenIcon';
import ApproveIcon from 'jsx:src/ui/assets/actionTypes/approve.svg';
import BorrowIcon from 'jsx:src/ui/assets/actionTypes/borrow.svg';
import CancelIcon from 'jsx:src/ui/assets/actionTypes/cancel.svg';
import ContractIcon from 'jsx:src/ui/assets/actionTypes/contract.svg';
import DepositIcon from 'jsx:src/ui/assets/actionTypes/deposit.svg';
import MintIcon from 'jsx:src/ui/assets/actionTypes/mint.svg';
import ReceiveIcon from 'jsx:src/ui/assets/actionTypes/receive.svg';
import RepayIcon from 'jsx:src/ui/assets/actionTypes/repay.svg';
import SendIcon from 'jsx:src/ui/assets/actionTypes/send.svg';
import SwapIcon from 'jsx:src/ui/assets/actionTypes/swap.svg';
import UnknownIcon from 'jsx:src/ui/assets/actionTypes/unknown.svg';
import WithdrawIcon from 'jsx:src/ui/assets/actionTypes/withdraw.svg';
import ChangeAssets2 from 'jsx:src/ui/assets/changed-assets-2.svg';
import ChangeAssets3 from 'jsx:src/ui/assets/changed-assets-3.svg';
import ChangeAssetsMore from 'jsx:src/ui/assets/changed-assets-more.svg';
import { getFungibleAsset, getNftAsset } from './TransactionItemValue';

export const TRANSACTION_ICON_SIZE = 24;
export const TRANSACTION_SMALL_ICON_SIZE = 18;
export const transactionIconStyle = {
  width: TRANSACTION_ICON_SIZE,
  height: TRANSACTION_ICON_SIZE,
};

export function TransactionTypeIcon({ type }: { type: ActionType }) {
  if (type === 'approve') {
    return <ApproveIcon style={transactionIconStyle} />;
  }
  if (type === 'borrow') {
    return <BorrowIcon style={transactionIconStyle} />;
  }
  if (type === 'cancel') {
    return <CancelIcon style={transactionIconStyle} />;
  }
  if (type === 'claim' || type === 'execute' || type === 'deployment') {
    return <ContractIcon style={transactionIconStyle} />;
  }
  if (type === 'deposit') {
    return <DepositIcon style={transactionIconStyle} />;
  }
  if (type === 'mint') {
    return <MintIcon style={transactionIconStyle} />;
  }
  if (type === 'receive' || type === 'unstake') {
    return <ReceiveIcon style={transactionIconStyle} />;
  }
  if (type === 'repay') {
    return <RepayIcon style={transactionIconStyle} />;
  }
  if (type === 'send' || type === 'stake') {
    return <SendIcon style={transactionIconStyle} />;
  }
  if (type === 'trade') {
    return <SwapIcon style={transactionIconStyle} />;
  }
  if (type === 'withdraw') {
    return <WithdrawIcon style={transactionIconStyle} />;
  }

  return <UnknownIcon style={transactionIconStyle} />;
}

function TransactionMultipleAssetsIcon({
  amount,
  size,
}: {
  amount: number;
  size: number;
}) {
  if (amount === 2) {
    return <ChangeAssets2 style={{ width: size, height: size }} />;
  }
  if (amount === 3) {
    return <ChangeAssets3 style={{ width: size, height: size }} />;
  }
  return <ChangeAssetsMore style={{ width: size, height: size }} />;
}

export function AssetIcon({
  asset,
  type,
  size,
}: {
  asset?: ActionAsset;
  type: ActionType;
  size: number;
}) {
  if (!asset) {
    return <TransactionTypeIcon type={type} />;
  }

  const fungible = getFungibleAsset(asset);
  const nft = getNftAsset(asset);

  return fungible?.icon_url ? (
    <TokenIcon size={size} src={fungible.icon_url} symbol={fungible.symbol} />
  ) : nft?.icon_url || nft?.collection.icon_url ? (
    <TokenIcon
      size={size}
      src={nft.icon_url || nft.collection.icon_url}
      style={{ borderRadius: 4 }}
      symbol={nft.symbol}
    />
  ) : (
    <TransactionTypeIcon type={type} />
  );
}

function TransferIcon({
  transfers,
  type,
  size,
}: {
  transfers: ActionTransfer[];
  type: ActionType;
  size: number;
}) {
  if (!transfers?.length) {
    return null;
  }
  if (transfers.length > 1) {
    return (
      <TransactionMultipleAssetsIcon amount={transfers.length} size={size} />
    );
  }
  return <AssetIcon asset={transfers[0].asset} type={type} size={size} />;
}

export function TransactionItemIcon({
  action,
}: {
  action: AddressAction | PendingAction;
}) {
  const approveTransfers = action.content?.single_asset;
  const incomingTransfers = action.content?.transfers?.incoming;
  const outgoingTransfers = action.content?.transfers?.outgoing;

  if (action.type.value === 'approve') {
    return (
      <AssetIcon
        asset={approveTransfers?.asset}
        type={action.type.value}
        size={TRANSACTION_ICON_SIZE}
      />
    );
  }

  if (incomingTransfers?.length && outgoingTransfers?.length) {
    return (
      <div
        style={{
          position: 'relative',
          width: TRANSACTION_ICON_SIZE,
          height: TRANSACTION_ICON_SIZE,
        }}
      >
        <div style={{ position: 'absolute', left: 0, top: 0 }}>
          <TransferIcon
            transfers={outgoingTransfers}
            type={action.type.value}
            size={TRANSACTION_SMALL_ICON_SIZE}
          />
        </div>
        <div style={{ position: 'absolute', bottom: 0, right: 0 }}>
          <TransferIcon
            transfers={incomingTransfers}
            type={action.type.value}
            size={TRANSACTION_SMALL_ICON_SIZE}
          />
        </div>
      </div>
    );
  }

  if (incomingTransfers?.length) {
    return (
      <TransferIcon
        transfers={incomingTransfers}
        type={action.type.value}
        size={TRANSACTION_ICON_SIZE}
      />
    );
  }

  if (outgoingTransfers?.length) {
    return (
      <TransferIcon
        transfers={outgoingTransfers}
        type={action.type.value}
        size={TRANSACTION_ICON_SIZE}
      />
    );
  }

  return <TransactionTypeIcon type={action.type.value} />;
}

import React, { useMemo } from 'react';
import ApproveIcon from 'jsx:src/ui/assets/actionTypes/approve.svg';
import BorrowIcon from 'jsx:src/ui/assets/actionTypes/borrow.svg';
import BurnIcon from 'jsx:src/ui/assets/actionTypes/burn.svg';
import CancelIcon from 'jsx:src/ui/assets/actionTypes/cancel.svg';
import ClaimIcon from 'jsx:src/ui/assets/actionTypes/claim.svg';
import ContractIcon from 'jsx:src/ui/assets/actionTypes/contract.svg';
import DeploymentIcon from 'jsx:src/ui/assets/actionTypes/deployment.svg';
import DepositIcon from 'jsx:src/ui/assets/actionTypes/deposit.svg';
import MintIcon from 'jsx:src/ui/assets/actionTypes/mint.svg';
import ReceiveIcon from 'jsx:src/ui/assets/actionTypes/receive.svg';
import RevokeIcon from 'jsx:src/ui/assets/actionTypes/revoke.svg';
import RepayIcon from 'jsx:src/ui/assets/actionTypes/repay.svg';
import SendIcon from 'jsx:src/ui/assets/actionTypes/send.svg';
import StakeIcon from 'jsx:src/ui/assets/actionTypes/stake.svg';
import SwapIcon from 'jsx:src/ui/assets/actionTypes/swap.svg';
import UnknownIcon from 'jsx:src/ui/assets/actionTypes/unknown.svg';
import UnstakeIcon from 'jsx:src/ui/assets/actionTypes/unstake.svg';
import WithdrawIcon from 'jsx:src/ui/assets/actionTypes/withdraw.svg';
import ChangeAssets2 from 'jsx:src/ui/assets/changed-assets-2.svg';
import ChangeAssets3 from 'jsx:src/ui/assets/changed-assets-3.svg';
import ChangeAssetsMore from 'jsx:src/ui/assets/changed-assets-more.svg';
import { AssetIcon } from 'src/ui/components/AssetIcon';
import type {
  Action,
  ActionType,
  Approval,
  Collection,
  FungibleOutline,
  NFTPreview,
  Transfer,
} from 'src/modules/zerion-api/requests/wallet-get-actions';

export const TRANSACTION_ICON_SIZE = 36;
export const TRANSACTION_SMALL_ICON_SIZE = 27;
export const transactionIconStyle = {
  width: TRANSACTION_ICON_SIZE,
  height: TRANSACTION_ICON_SIZE,
};

export function TransactionTypeIcon({
  type,
  size,
}: {
  type: ActionType;
  size?: number;
}) {
  const style = useMemo(
    () => ({
      display: 'flex',
      backgroundColor: 'var(--white)',
      borderRadius: '50%',
      ...(size
        ? {
            width: size,
            height: size,
          }
        : transactionIconStyle),
    }),
    [size]
  );

  if (type === 'approve') {
    return <ApproveIcon style={style} />;
  }
  if (type === 'borrow') {
    return <BorrowIcon style={style} />;
  }
  if (type === 'burn') {
    return <BurnIcon style={style} />;
  }
  if (type === 'cancel') {
    return <CancelIcon style={style} />;
  }
  if (type === 'claim') {
    return <ClaimIcon style={style} />;
  }
  if (type === 'execute') {
    return <ContractIcon style={style} />;
  }
  if (type === 'deploy') {
    return <DeploymentIcon style={style} />;
  }
  if (type === 'deposit') {
    return <DepositIcon style={style} />;
  }
  if (type === 'mint') {
    return <MintIcon style={style} />;
  }
  if (type === 'receive') {
    return <ReceiveIcon style={style} />;
  }
  if (type === 'revoke') {
    return <RevokeIcon style={style} />;
  }
  if (type === 'repay') {
    return <RepayIcon style={style} />;
  }
  if (type === 'send') {
    return <SendIcon style={style} />;
  }
  if (type === 'stake') {
    return <StakeIcon style={style} />;
  }
  if (type === 'trade') {
    return <SwapIcon style={style} />;
  }
  if (type === 'unstake') {
    return <UnstakeIcon style={style} />;
  }
  if (type === 'withdraw') {
    return <WithdrawIcon style={style} />;
  }

  return <UnknownIcon style={style} />;
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

export function HistoryAssetIcon({
  fungible,
  nft,
  collection,
  type,
  size,
}: {
  fungible: FungibleOutline | null;
  nft: NFTPreview | null;
  collection: Collection | null;
  type: ActionType;
  size: number;
}) {
  if (!fungible && !nft && !collection) {
    return <TransactionTypeIcon type={type} />;
  }

  return (
    <AssetIcon
      fungible={fungible}
      nft={nft}
      collection={collection}
      size={size}
      fallback={<TransactionTypeIcon type={type} size={size} />}
    />
  );
}

function ApprovalIcon({
  approvals,
  type,
  size,
}: {
  approvals: Approval[];
  type: ActionType;
  size: number;
}) {
  if (!approvals.length) {
    return null;
  }
  if (approvals.length > 1) {
    return (
      <TransactionMultipleAssetsIcon amount={approvals.length} size={size} />
    );
  }

  return (
    <HistoryAssetIcon
      fungible={approvals[0].fungible}
      nft={approvals[0].nft}
      collection={null}
      type={type}
      size={size}
    />
  );
}

function TransferIcon({
  transfers,
  type,
  size,
}: {
  transfers: Transfer[];
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
  return (
    <HistoryAssetIcon
      fungible={transfers[0].fungible}
      nft={transfers[0].nft}
      collection={null}
      type={type}
      size={size}
    />
  );
}

export function TransactionItemIcon({ action }: { action: Action }) {
  const approvals = action.content?.approvals;
  const incomingTransfers = useMemo(
    () => action.content?.transfers?.filter((t) => t.direction === 'in'),
    [action]
  );
  const outgoingTransfers = useMemo(
    () => action.content?.transfers?.filter((t) => t.direction === 'out'),
    [action]
  );

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

  if (approvals) {
    return (
      <ApprovalIcon
        approvals={approvals}
        type={action.type.value}
        size={TRANSACTION_ICON_SIZE}
      />
    );
  }

  return <TransactionTypeIcon type={action.type.value} />;
}

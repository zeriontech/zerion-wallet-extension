import React from 'react';
import { minus } from 'src/ui/shared/typography';
import { HStack } from 'src/ui/ui-kit/HStack';
import type BigNumber from 'bignumber.js';
import { formatCurrencyValue } from 'src/shared/units/formatCurrencyValue';
import { AssetQuantity } from 'src/ui/components/AssetQuantity';
import { AssetLink } from 'src/ui/components/AssetLink';
import { NFTLink } from 'src/ui/components/NFTLink';
import type {
  ActionDirection,
  ActionType,
  Amount,
  Approval,
  FungibleOutline,
  NFTPreview,
  Transfer,
} from 'src/modules/zerion-api/requests/wallet-get-actions';

function getSign(
  decimaledValue?: number | BigNumber | string,
  direction?: ActionDirection | null
) {
  if (!decimaledValue || !direction) {
    return '';
  }
  return direction === 'in' ? '+' : minus;
}

export function HistoryTokenValue({
  actionType,
  amount,
  fungible,
  direction,
  withLink,
}: {
  actionType: ActionType;
  amount: Amount | null;
  fungible: FungibleOutline;
  direction: ActionDirection | null;
  withLink: boolean;
}) {
  const sign = getSign(amount?.value || 0, direction);
  const quantity = actionType === 'revoke' ? null : amount?.quantity;

  return (
    <HStack
      gap={4}
      alignItems="center"
      style={{
        gridTemplateColumns:
          quantity != null
            ? 'minmax(min-content, max-content) minmax(20px, max-content)'
            : 'minmax(min-content, max-content)',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
      }}
      title={quantity || undefined}
    >
      {quantity ? <AssetQuantity sign={sign} quantity={quantity} /> : null}
      {withLink ? (
        <AssetLink fungible={fungible} />
      ) : (
        fungible.symbol || fungible.name
      )}
    </HStack>
  );
}

export function HistoryNFTValue({
  amount,
  nft,
  direction,
  withLink,
}: {
  amount: Amount | null;
  nft: NFTPreview;
  direction: ActionDirection | null;
  withLink?: boolean;
}) {
  return (
    <HStack
      gap={4}
      alignItems="center"
      style={{ gridTemplateColumns: 'minmax(40px, 1fr) auto' }}
    >
      {(Number(amount?.quantity) || 0) > 1 ? (
        <span>
          {getSign(amount?.quantity, direction)}
          {amount?.quantity}
        </span>
      ) : null}
      {withLink ? <NFTLink nft={nft} /> : nft?.metadata?.name || 'NFT'}
    </HStack>
  );
}

export function HistoryItemValue({
  actionType,
  transfers,
  withLink,
}: {
  actionType: ActionType;
  transfers?: Transfer[];
  withLink: boolean;
}) {
  if (!transfers?.length) {
    return null;
  }

  if (transfers.length > 1) {
    return (
      <span>
        {transfers[0].direction === 'out' ? minus : '+'}
        {transfers.length} assets
      </span>
    );
  }

  const transfer = transfers[0];

  return transfer.nft ? (
    <HistoryNFTValue
      nft={transfer.nft}
      direction={transfer.direction}
      amount={transfer.amount}
      withLink={withLink}
    />
  ) : transfer.fungible ? (
    <HistoryTokenValue
      actionType={actionType}
      amount={transfer.amount}
      fungible={transfer.fungible}
      direction={transfer.direction}
      withLink={withLink}
    />
  ) : null;
}

export function HistoryApprovalValue({
  approvals,
  withLink,
}: {
  approvals: Approval[];
  withLink: boolean;
}) {
  if (!approvals.length) {
    return null;
  }

  if (approvals.length > 1) {
    return <span>{approvals.length} assets</span>;
  }

  const approval = approvals[0];

  return approval.nft ? (
    withLink ? (
      <NFTLink nft={approval.nft} />
    ) : (
      <span>{approval.nft.metadata?.name || 'NFT'}</span>
    )
  ) : approval.fungible ? (
    withLink ? (
      <AssetLink fungible={approval.fungible} title={approval.fungible.name} />
    ) : (
      <span>{approval.fungible.name || approval.fungible.symbol}</span>
    )
  ) : approval.collection ? (
    <span>{approval.collection.name}</span>
  ) : null;
}

export function TransactionCurrencyValue({
  transfers,
  currency,
}: {
  transfers?: Transfer[];
  currency: string;
}) {
  if (transfers?.length !== 1) {
    return null;
  }
  const transfer = transfers[0];
  if (transfer.amount?.value == null) {
    return null;
  }
  const value = formatCurrencyValue(transfer.amount.value, 'en', currency);
  return <>{value}</>;
}

import React, { useMemo } from 'react';
import { minus } from 'src/ui/shared/typography';
import { HStack } from 'src/ui/ui-kit/HStack';
import BigNumber from 'bignumber.js';
import { formatCurrencyValue } from 'src/shared/units/formatCurrencyValue';
import { AssetQuantity } from 'src/ui/components/AssetQuantity';
import { AssetLink } from 'src/ui/components/AssetLink';
import { NFTLink } from 'src/ui/components/NFTLink';
import type {
  ActionDirection,
  ActionType,
  Amount,
  Approval,
  NFTPreview,
  Transfer,
} from 'src/modules/zerion-api/requests/wallet-get-actions';
import type { Fungible } from 'src/modules/zerion-api/types/Fungible';
import type { Kind } from 'src/ui/ui-kit/UIText';
import { BlurrableBalance } from 'src/ui/components/BlurrableBalance';
import { formatTokenValue } from 'src/shared/units/formatTokenValue';

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
  kind,
}: {
  actionType: ActionType;
  amount: Amount | null;
  fungible: Fungible;
  direction: ActionDirection | null;
  withLink: boolean;
  kind: Kind;
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
      <BlurrableBalance kind={kind}>
        {quantity ? <AssetQuantity sign={sign} quantity={quantity} /> : null}
      </BlurrableBalance>
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
  kind,
}: {
  amount: Amount | null;
  nft: NFTPreview;
  direction: ActionDirection | null;
  withLink?: boolean;
  kind: Kind;
}) {
  const sign = getSign(amount?.value || 0, direction);
  const quantity = amount?.quantity;

  const formattedValue = useMemo(() => {
    if (!quantity) {
      return null;
    }
    const quantityNumber = new BigNumber(quantity);
    return `${sign || ''}${formatTokenValue(quantity, '', {
      notation: quantityNumber.gt(new BigNumber(1e4)) ? 'compact' : undefined,
    })}`;
  }, [quantity, sign]);

  return (
    <HStack
      gap={4}
      alignItems="center"
      style={{
        gridTemplateColumns:
          quantity && (Number(quantity) || 0) > 1
            ? 'minmax(min-content, max-content) minmax(20px, max-content)'
            : 'minmax(min-content, max-content)',
      }}
    >
      {quantity && (Number(quantity) || 0) > 1 ? (
        <BlurrableBalance kind={kind}>
          <span title={quantity}>{formattedValue}</span>
        </BlurrableBalance>
      ) : null}
      {withLink ? (
        <NFTLink nft={nft} />
      ) : (
        <span>{nft?.metadata?.name || 'NFT'}</span>
      )}
    </HStack>
  );
}

export function HistoryItemValue({
  actionType,
  transfers,
  withLink,
  kind,
}: {
  actionType: ActionType;
  transfers?: Transfer[];
  withLink: boolean;
  kind: Kind;
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
      kind={kind}
    />
  ) : transfer.fungible ? (
    <HistoryTokenValue
      actionType={actionType}
      amount={transfer.amount}
      fungible={transfer.fungible}
      direction={transfer.direction}
      withLink={withLink}
      kind={kind}
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
  kind,
}: {
  transfers?: Transfer[];
  currency: string;
  kind: Kind;
}) {
  if (transfers?.length !== 1) {
    return null;
  }
  const transfer = transfers[0];
  if (transfer.amount?.value == null) {
    return null;
  }
  const value = formatCurrencyValue(transfer.amount.value, 'en', currency);
  return <BlurrableBalance kind={kind}>{value}</BlurrableBalance>;
}

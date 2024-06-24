import React, { useMemo } from 'react';
import type { NFTAsset, Asset, Direction, ActionTransfer } from 'defi-sdk';
import { minus } from 'src/ui/shared/typography';
import { HStack } from 'src/ui/ui-kit/HStack';
import type { Chain } from 'src/modules/networks/Chain';
import { getCommonQuantity } from 'src/modules/networks/asset';
import {
  getFungibleAsset,
  getNftAsset,
} from 'src/modules/ethereum/transactions/actionAsset';
import type BigNumber from 'bignumber.js';
import { formatCurrencyValue } from 'src/shared/units/formatCurrencyValue';
import { AssetQuantity } from 'src/ui/components/AssetQuantity';
import { AssetLink } from 'src/ui/components/AssetLink';
import { NFTLink } from 'src/ui/components/NFTLink';

function getSign(
  decimaledValue?: number | BigNumber | string,
  direction?: Direction
) {
  if (!decimaledValue || !direction || direction === 'self') {
    return '';
  }
  return direction === 'in' ? '+' : minus;
}

function HistoryTokenValue({
  value,
  asset,
  chain,
  direction,
  address,
  withLink,
}: {
  value: number | string;
  asset: Asset;
  chain: Chain;
  direction: Direction;
  address?: string;
  withLink: boolean;
}) {
  const sign = getSign(value, direction);
  const commonQuantity = useMemo(
    () =>
      getCommonQuantity({
        asset,
        chain,
        baseQuantity: value,
      }),
    [chain, asset, value]
  );

  return (
    <HStack
      gap={4}
      alignItems="center"
      style={{
        gridTemplateColumns:
          'minmax(min-content, max-content) minmax(20px, max-content)',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
      }}
      title={commonQuantity.toFixed()}
    >
      <AssetQuantity sign={sign} commonQuantity={commonQuantity} />
      {withLink ? (
        <AssetLink asset={asset} address={address} />
      ) : (
        asset.symbol?.toUpperCase() || asset.name
      )}
    </HStack>
  );
}

export function HistoryNFTValue({
  quantity = 0,
  nftAsset,
  chain,
  name,
  direction,
  address,
  withLink,
}: {
  quantity?: number;
  nftAsset?: NFTAsset | null;
  chain?: Chain;
  name?: string;
  direction?: Direction;
  address?: string;
  withLink?: boolean;
}) {
  return (
    <HStack
      gap={4}
      alignItems="center"
      style={{ gridTemplateColumns: 'minmax(40px, 1fr) auto' }}
    >
      {quantity > 1 ? (
        <span>
          {getSign(quantity, direction)}
          {quantity}
        </span>
      ) : null}
      {(!quantity || quantity === 1) && nftAsset?.asset_code && withLink ? (
        <NFTLink nft={nftAsset} chain={chain} address={address} title={name} />
      ) : (
        name
      )}
    </HStack>
  );
}

export function HistoryItemValue({
  transfers,
  direction,
  chain,
  address,
  withLink,
}: {
  transfers?: Pick<ActionTransfer, 'asset' | 'quantity'>[];
  direction: Direction;
  chain: Chain;
  address?: string;
  withLink: boolean;
}) {
  if (!transfers?.length) {
    return null;
  }

  if (transfers.length > 1) {
    return (
      <span>
        {direction === 'out' ? minus : '+'}
        {transfers.length} assets
      </span>
    );
  }

  const nftAsset = getNftAsset(transfers[0].asset);
  const fungibleAsset = getFungibleAsset(transfers[0].asset);

  return nftAsset ? (
    <HistoryNFTValue
      address={address}
      nftAsset={nftAsset}
      direction={direction}
      quantity={1}
      name={nftAsset.name || nftAsset.collection?.name}
      chain={chain}
      withLink={withLink}
    />
  ) : fungibleAsset ? (
    <HistoryTokenValue
      address={address}
      asset={fungibleAsset}
      chain={chain}
      value={transfers[0].quantity}
      direction={direction}
      withLink={withLink}
    />
  ) : null;
}

export function TransactionCurrencyValue({
  transfers,
  chain,
  currency,
}: {
  transfers?: ActionTransfer[];
  chain: Chain;
  currency: string;
}) {
  if (transfers?.length !== 1) {
    return null;
  }
  const transfer = transfers[0];
  const asset = getFungibleAsset(transfer.asset);
  if (!asset) {
    return null;
  }

  const commonQuantity = getCommonQuantity({
    asset,
    chain,
    baseQuantity: transfer.quantity,
  });
  const value = formatCurrencyValue(
    commonQuantity.times(transfer.price || 0),
    'en',
    currency
  );
  return <>{value}</>;
}

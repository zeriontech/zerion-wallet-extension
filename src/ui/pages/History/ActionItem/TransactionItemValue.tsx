import React from 'react';
import type { NFTAsset, Asset, Direction, ActionTransfer } from 'defi-sdk';
import { minus } from 'src/ui/shared/typography';
import { formatTokenValue } from 'src/shared/units/formatTokenValue';
import { HStack } from 'src/ui/ui-kit/HStack';
import type { Chain } from 'src/modules/networks/Chain';
import { getCommonQuantity } from 'src/modules/networks/asset';
import { getAssetQuantity } from 'src/modules/networks/asset';
import { TextAnchor } from 'src/ui/ui-kit/TextAnchor';
import {
  getFungibleAsset,
  getNftAsset,
} from 'src/modules/ethereum/transactions/actionAsset';
import { AssetQuantityValue } from 'src/ui/components/AssetQuantityValue';
import type BigNumber from 'bignumber.js';
import { formatCurrencyValue } from 'src/shared/units/formatCurrencyValue';
import { openInNewWindow } from 'src/ui/shared/openInNewWindow';
import { NetworkId } from 'src/modules/networks/NetworkId';
import { AssetLink } from '../ActionDetailedView/components/AssetLink';

function getSign(decimaledValue?: number | BigNumber, direction?: Direction) {
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
}: {
  value: number;
  asset: Asset;
  chain: Chain;
  direction: Direction;
  address?: string;
}) {
  const tokenTitle = asset.symbol?.toUpperCase() || asset.name;
  const sign = getSign(value, direction);
  const quantity = getAssetQuantity({
    asset,
    chain,
    quantity: value,
  });
  const formatted = formatTokenValue(value);

  return (
    <HStack
      gap={4}
      alignItems="center"
      style={{
        gridTemplateColumns: 'minmax(8px, 1fr) auto',
        overflow: 'hidden',
      }}
      title={`${sign}${formatted} ${tokenTitle}`}
    >
      <AssetQuantityValue sign={sign} quantity={quantity} />
      <AssetLink asset={asset} address={address} />
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
}: {
  quantity?: number;
  nftAsset?: NFTAsset | null;
  chain?: Chain;
  name?: string;
  direction?: Direction;
  address?: string;
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
      {(!quantity || quantity === 1) && nftAsset?.asset_code ? (
        <TextAnchor
          href={`https://app.zerion.io/nfts/${
            chain?.toString() || NetworkId.Ethereum
          }/${nftAsset.asset_code}?address=${address}`}
          target="_blank"
          title={name}
          rel="noopener noreferrer"
          onClick={(e) => {
            e.stopPropagation();
            openInNewWindow(e);
          }}
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            outlineOffset: -1, // make focus ring visible despite overflow: hidden
          }}
        >
          {name}
        </TextAnchor>
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
}: {
  transfers?: ActionTransfer[];
  direction: 'in' | 'out';
  chain: Chain;
  address?: string;
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
    />
  ) : fungibleAsset ? (
    <HistoryTokenValue
      address={address}
      asset={fungibleAsset}
      chain={chain}
      value={transfers[0].quantity}
      direction={direction}
    />
  ) : null;
}

export function TransactionCurrencyValue({
  transfers,
  chain,
}: {
  transfers?: ActionTransfer[];
  chain: Chain;
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
    quantity: transfer.quantity,
  });
  const value = formatCurrencyValue(
    commonQuantity.times(transfer.price || 0),
    'en',
    'usd'
  );
  return <>{value}</>;
}

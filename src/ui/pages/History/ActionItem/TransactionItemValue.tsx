import React from 'react';
import BigNumber from 'bignumber.js';
import type {
  NFTAsset,
  Asset,
  Direction,
  ActionAsset,
  ActionTransfer,
} from 'defi-sdk';
import { minus, muchGreater, veryMuchGreater } from 'src/ui/shared/typography';
import { formatTokenValue } from 'src/shared/units/formatTokenValue';
import { HStack } from 'src/ui/ui-kit/HStack';
import { middleTruncate } from 'src/ui/shared/middleTruncate';
import { Chain } from 'src/modules/networks/Chain';
import { getDecimals } from 'src/modules/networks/asset';
import { baseToCommon } from 'src/shared/units/convert';
import { TextAnchor } from 'src/ui/ui-kit/TextAnchor';
import { formatCurrencyValue } from 'src/shared/units/formatCurrencyValue';

function getSign(decimaledValue?: number | BigNumber, direction?: Direction) {
  if (!decimaledValue || !direction || direction === 'self') {
    return '';
  }
  return direction === 'in' ? '+' : minus;
}

export function getFungibleAsset(asset?: ActionAsset) {
  if (asset?.fungible && 'asset_code' in asset.fungible) {
    return asset.fungible as Asset;
  }
  return null;
}

export function getNftAsset(asset?: ActionAsset) {
  if (asset?.nft && 'asset_code' in asset.nft) {
    return asset.nft as NFTAsset;
  }
  return null;
}

export function HistoryTokenValue({
  value,
  asset,
  direction,
  address,
}: {
  value?: BigNumber;
  asset?: Asset | null;
  direction?: Direction;
  address?: string;
}) {
  if (!asset) {
    return null;
  }

  const tokenTitle = asset.symbol?.toUpperCase() || asset.name;
  const sign = getSign(value, direction);

  const infiniteValue = value && value.gt(new BigNumber(1e15));
  const veryInfiniteValue = value && value.gt(new BigNumber(1e21));

  const formattedWithSighnificantValue = value
    ? formatTokenValue(value, '', {
        notation: value.gt(new BigNumber(1e8)) ? 'compact' : undefined,
      })
    : '';

  const truncated =
    value &&
    value.lt(new BigNumber(1)) &&
    formattedWithSighnificantValue.length > 8
      ? `${middleTruncate({
          value: value.toString(),
          trailingLettersCount: 5,
        })}\u00a0`
      : '';

  const displayedValue = veryInfiniteValue ? (
    <span>
      <span style={{ position: 'relative', top: -1 }}>{veryMuchGreater}</span>
      1T
    </span>
  ) : infiniteValue ? (
    `${muchGreater} 1T`
  ) : (
    `${sign}${(truncated || formattedWithSighnificantValue).trim()}`
  );

  const formatted = value ? formatTokenValue(value) : null;

  return (
    <HStack
      gap={4}
      alignItems="center"
      style={{ gridTemplateColumns: 'auto minmax(0, 1fr)', overflow: 'hidden' }}
      title={formatted ? `${sign}${formatted} ${tokenTitle}` : undefined}
    >
      {displayedValue}
      <TextAnchor
        href={`https://app.zerion.io/explore/asset/${asset.symbol}-${asset.asset_code}?address=${address}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {tokenTitle}
      </TextAnchor>
    </HStack>
  );
}

export function HistoryNFTValue({
  quantity = 0,
  nftAsset,
  name,
  direction,
  address,
}: {
  quantity?: number;
  nftAsset?: NFTAsset | null;
  name?: string;
  direction?: Direction;
  address?: string;
}) {
  return (
    <HStack gap={4} alignItems="center">
      {quantity > 1 ? (
        <span>
          {getSign(quantity, direction)}
          {quantity}
        </span>
      ) : null}
      {(!quantity || quantity === 1) && nftAsset?.asset_code ? (
        <TextAnchor
          href={`https://app.zerion.io/nfts/${nftAsset.asset_code}?address=${address}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
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
      name={nftAsset.name || nftAsset.collection.name}
    />
  ) : fungibleAsset ? (
    <HistoryTokenValue
      address={address}
      asset={fungibleAsset}
      value={baseToCommon(
        transfers[0].quantity,
        getDecimals({ asset: fungibleAsset, chain })
      )}
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

  const fungibleAsset = getFungibleAsset(transfers[0].asset);

  if (!fungibleAsset) {
    return null;
  }

  return (
    <>
      {formatCurrencyValue(
        baseToCommon(
          transfers[0].quantity,
          getDecimals({
            asset: fungibleAsset,
            chain,
          })
        ).times(transfers[0].price || 0),
        'en',
        'usd'
      )}
    </>
  );
}

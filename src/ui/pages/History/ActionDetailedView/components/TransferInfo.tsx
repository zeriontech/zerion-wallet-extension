import type { ActionAsset, ActionTransfer } from 'defi-sdk';
import React, { useMemo } from 'react';
import BigNumber from 'bignumber.js';
import {
  getFungibleAsset,
  getNftAsset,
} from 'src/modules/ethereum/transactions/actionAsset';
import { invariant } from 'src/shared/invariant';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Surface } from 'src/ui/ui-kit/Surface';
import { TokenIcon } from 'src/ui/ui-kit/TokenIcon';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { Media } from 'src/ui/ui-kit/Media';
import { getDecimals } from 'src/modules/networks/asset';
import { commonToBase } from 'src/shared/units/convert';
import type { Chain } from 'src/modules/networks/Chain';
import { almostEqual, minus } from 'src/ui/shared/typography';
import { formatTokenValue } from 'src/shared/units/formatTokenValue';
import { formatCurrencyValue } from 'src/shared/units/formatCurrencyValue';
import ChevronRightIcon from 'jsx:src/ui/assets/chevron-right.svg';
import { UnstyledAnchor } from 'src/ui/ui-kit/UnstyledAnchor';
import { openInNewWindow } from 'src/ui/shared/openInNewWindow';
import { NetworkId } from 'src/modules/networks/NetworkId';
import * as helperStyles from 'src/ui/style/helpers.module.css';
import { AssetLink } from './AssetLink';

type Direction = 'incoming' | 'outgoing';
const ICON_SIZE = 36;

export function ApprovalInfo({
  asset,
  address,
}: {
  asset: ActionAsset;
  address?: string;
}) {
  const fungible = getFungibleAsset(asset);

  if (!fungible) {
    return null;
  }

  return (
    <Surface padding={12}>
      <HStack
        gap={12}
        alignItems="center"
        style={{ gridTemplateColumns: 'auto 1fr' }}
      >
        <TokenIcon
          src={fungible.icon_url}
          size={ICON_SIZE}
          title={fungible.name}
          symbol={fungible.symbol}
        />
        <UIText
          kind="headline/h3"
          style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}
        >
          <AssetLink asset={fungible} address={address} title={fungible.name} />
        </UIText>
      </HStack>
    </Surface>
  );
}

function FungibleTransfer({
  transfer,
  address,
  direction,
  chain,
}: {
  transfer: ActionTransfer;
  address?: string;
  direction: Direction;
  chain: Chain;
}) {
  const fungible = getFungibleAsset(transfer.asset);
  invariant(fungible, 'Transfer with fungible asset should contain one');
  const balance = useMemo(
    () =>
      fungible
        ? commonToBase(
            transfer.quantity,
            0 - getDecimals({ asset: fungible, chain })
          )
        : new BigNumber(0),
    [transfer, fungible, chain]
  );

  return (
    <Media
      gap={12}
      vGap={0}
      image={
        <TokenIcon
          src={fungible.icon_url}
          size={ICON_SIZE}
          title={fungible.name}
          symbol={fungible.symbol}
        />
      }
      text={
        <UIText
          kind="headline/h3"
          color={direction === 'incoming' ? 'var(--positive-500)' : undefined}
        >
          <HStack
            gap={4}
            style={{
              gridTemplateColumns: 'minmax(10px, 1fr) auto',
            }}
          >
            <span
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={formatTokenValue(balance, fungible.symbol)}
            >
              {direction === 'incoming' ? '+' : minus}
              {formatTokenValue(balance, '')}
            </span>
            <AssetLink asset={fungible} address={address} />
          </HStack>
        </UIText>
      }
      detailText={
        <UIText
          kind="small/regular"
          color="var(--neutral-500)"
          style={{ textDecoration: 'none' }}
        >
          {almostEqual}
          {formatCurrencyValue(balance.times(transfer.price || 0), 'en', 'usd')}
        </UIText>
      }
    />
  );
}

function NFTTransfer({
  transfer,
  address,
  direction,
  chain,
}: {
  transfer: ActionTransfer;
  address?: string;
  direction: Direction;
  chain: Chain;
}) {
  const nft = getNftAsset(transfer.asset);
  invariant(nft, 'Transfer with non-fungible asset should contain one');
  const title = nft.name || nft.collection_info?.name;
  const nftContent = (
    <HStack
      gap={12}
      alignItems="center"
      style={{ gridTemplateColumns: 'auto 1fr' }}
    >
      <TokenIcon
        size={ICON_SIZE}
        src={nft.icon_url || nft.collection?.icon_url}
        style={{ borderRadius: 4 }}
        symbol={nft.symbol}
      />
      <UIText
        kind="headline/h3"
        style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {title}
      </UIText>
    </HStack>
  );

  return direction === 'incoming' ? (
    <UnstyledAnchor
      href={`https://app.zerion.io/nfts/${
        chain?.toString() || NetworkId.Ethereum
      }/${nft.asset_code}?address=${address}`}
      target="_blank"
      title={nft.name}
      rel="noopener noreferrer"
      onClick={(e) => {
        e.stopPropagation();
        openInNewWindow(e);
      }}
      className={helperStyles.hoverUnderline}
      style={{ color: 'var(--positive-500)' }}
    >
      <HStack
        gap={12}
        alignItems="center"
        justifyContent="space-between"
        style={{ gridTemplateColumns: '1fr auto' }}
      >
        {nftContent}
        <ChevronRightIcon
          style={{ color: 'var(--neutral-500)', width: 40, height: 40 }}
        />
      </HStack>
    </UnstyledAnchor>
  ) : (
    nftContent
  );
}

export function TransferInfo({
  transfers,
  title,
  address,
  direction,
  chain,
}: {
  transfers: ActionTransfer[];
  title?: 'Send' | 'Receive';
  address?: string;
  direction: Direction;
  chain: Chain;
}) {
  return (
    <Surface padding={title ? '8px 12px' : 12}>
      <VStack gap={4}>
        {title ? (
          <UIText kind="small/accent" color="var(--neutral-500)">
            {title}
          </UIText>
        ) : null}
        {transfers.map((transfer, index) => {
          const fungible = getFungibleAsset(transfer.asset);
          const nft = getNftAsset(transfer.asset);
          if (nft) {
            return (
              <NFTTransfer
                key={index}
                transfer={transfer}
                address={address}
                direction={direction}
                chain={chain}
              />
            );
          }
          if (fungible) {
            return (
              <FungibleTransfer
                key={index}
                transfer={transfer}
                address={address}
                direction={direction}
                chain={chain}
              />
            );
          }
          return null;
        })}
      </VStack>
    </Surface>
  );
}

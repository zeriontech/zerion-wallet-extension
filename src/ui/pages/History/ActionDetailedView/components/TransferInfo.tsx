import type { ActionAsset, ActionTransfer } from 'defi-sdk';
import React, { useMemo } from 'react';
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
import { getCommonQuantity } from 'src/modules/networks/asset';
import type { Chain } from 'src/modules/networks/Chain';
import { almostEqual, minus } from 'src/ui/shared/typography';
import { formatTokenValue } from 'src/shared/units/formatTokenValue';
import { formatCurrencyValue } from 'src/shared/units/formatCurrencyValue';
import ChevronRightIcon from 'jsx:src/ui/assets/chevron-right.svg';
import { UnstyledAnchor } from 'src/ui/ui-kit/UnstyledAnchor';
import { NetworkId } from 'src/modules/networks/NetworkId';
import * as helperStyles from 'src/ui/style/helpers.module.css';
import { AssetLink } from 'src/ui/components/AssetLink';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { isUnlimitedApproval } from '../../isUnlimitedApproval';

type Direction = 'incoming' | 'outgoing';
const ICON_SIZE = 36;

export function ApprovalInfo({
  approvalInfo,
  address,
  chain,
}: {
  approvalInfo: {
    asset: ActionAsset;
    quantity: string;
  };
  address?: string;
  chain: Chain;
}) {
  const fungible = getFungibleAsset(approvalInfo.asset);

  const tokenQuantity = useMemo(
    () =>
      fungible
        ? getCommonQuantity({
            asset: fungible,
            chain,
            baseQuantity: approvalInfo.quantity,
          })
        : null,
    [approvalInfo, fungible, chain]
  );

  if (!fungible) {
    return null;
  }

  const isUnlimited = isUnlimitedApproval(approvalInfo.quantity);

  return (
    <Surface padding={12}>
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
            style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}
          >
            <AssetLink
              asset={fungible}
              address={address}
              title={fungible.name}
            />
          </UIText>
        }
        detailText={
          tokenQuantity ? (
            <UIText
              kind="small/regular"
              color="var(--neutral-500)"
              style={{ overflowWrap: 'break-word' }}
            >
              {isUnlimited
                ? 'Unlimited'
                : formatTokenValue(tokenQuantity, fungible.symbol)}
            </UIText>
          ) : null
        }
      />
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
  const { currency } = useCurrency();
  const fungible = getFungibleAsset(transfer.asset);
  invariant(fungible, 'Transfer with fungible asset should contain one');
  const balance = useMemo(
    () =>
      getCommonQuantity({
        asset: fungible,
        chain,
        baseQuantity: transfer.quantity,
      }),
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
        <UIText kind="small/regular" color="var(--neutral-500)">
          {almostEqual}
          {formatCurrencyValue(
            balance.times(transfer.price || 0),
            'en',
            currency
          )}
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

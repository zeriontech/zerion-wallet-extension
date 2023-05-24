import type {
  ActionTransfer,
  ActionTransfers,
  Asset,
  Direction,
  NFTAsset,
} from 'defi-sdk';
import React, { useMemo } from 'react';
import { Media } from 'src/ui/ui-kit/Media';
import { SurfaceList } from 'src/ui/ui-kit/SurfaceList';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import type { Chain } from 'src/modules/networks/Chain';
import { AssetIcon } from 'src/ui/components/AssetIcon';
import UnknownIcon from 'jsx:src/ui/assets/actionTypes/unknown.svg';
import {
  getAssetQuantity,
  getCommonQuantity,
} from 'src/modules/networks/asset';
import {
  getFungibleAsset,
  getNftAsset,
} from 'src/modules/ethereum/transactions/actionAsset';
import { AssetQuantityValue } from 'src/ui/components/AssetQuantityValue';
import { TextAnchor } from 'src/ui/ui-kit/TextAnchor';
import { minus, noValueDash } from 'src/ui/shared/typography';
import { formatCurrencyValue } from 'src/shared/units/formatCurrencyValue';
import { Surface } from 'src/ui/ui-kit/Surface';
import { Spacer } from 'src/ui/ui-kit/Spacer';

function TransferItemFungible({
  address,
  transfer,
  fungible,
  chain,
  direction,
}: {
  address: string;
  transfer: ActionTransfer;
  fungible: Asset;
  chain: Chain;
  direction: Direction;
}) {
  const title = fungible.symbol.toUpperCase();
  const quantity = useMemo(
    () =>
      getAssetQuantity({
        asset: fungible,
        chain,
        quantity: transfer.quantity,
      }),
    [chain, fungible, transfer.quantity]
  );
  const amountInUsd = useMemo(() => {
    if (!transfer.price) {
      return noValueDash;
    }
    const commonQuantity = getCommonQuantity({
      asset: fungible,
      chain,
      quantity: transfer.quantity,
    });
    return formatCurrencyValue(
      commonQuantity.times(transfer.price),
      'en',
      'usd'
    );
  }, [chain, fungible, transfer]);

  return (
    <Media
      vGap={0}
      image={
        <AssetIcon
          size={36}
          asset={transfer.asset}
          fallback={<UnknownIcon style={{ width: 36, height: 36 }} />}
        />
      }
      text={
        <UIText
          kind="headline/h3"
          color={direction === 'in' ? 'var(--positive-500)' : 'var(--black)'}
        >
          <AssetQuantityValue
            sign={direction === 'in' ? '+' : minus}
            quantity={quantity}
          />{' '}
          <TextAnchor
            href={`https://app.zerion.io/explore/asset/${fungible.symbol}-${fungible.asset_code}?address=${address}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {title}
          </TextAnchor>
        </UIText>
      }
      detailText={
        <UIText kind="caption/regular" color="var(--neutral-500)">
          {amountInUsd}
        </UIText>
      }
    />
  );
}

function TransferItemNFT({
  transfer,
  nft,
  direction,
}: {
  transfer: ActionTransfer;
  nft: NFTAsset;
  direction: Direction;
}) {
  return (
    <Media
      vGap={0}
      image={
        <AssetIcon
          size={36}
          asset={transfer.asset}
          fallback={<UnknownIcon style={{ width: 36, height: 36 }} />}
        />
      }
      text={
        <UIText
          kind="headline/h3"
          color={direction === 'in' ? 'var(--positive-500)' : 'var(--black)'}
        >
          {nft.name}
        </UIText>
      }
      detailText={
        <UIText kind="caption/regular" color="var(--neutral-500)">
          Amount: 1
        </UIText>
      }
    />
  );
}

function TransferItem({
  address,
  transfer,
  chain,
  direction,
}: {
  address: string;
  transfer: ActionTransfer;
  chain: Chain;
  direction: Direction;
}) {
  const fungible = getFungibleAsset(transfer.asset);
  const nft = getNftAsset(transfer.asset);

  if (fungible) {
    return (
      <TransferItemFungible
        address={address}
        transfer={transfer}
        fungible={fungible}
        chain={chain}
        direction={direction}
      />
    );
  } else if (nft) {
    return (
      <TransferItemNFT transfer={transfer} nft={nft} direction={direction} />
    );
  }

  return null;
}

export function Transfers({
  address,
  chain,
  transfers,
}: {
  address: string;
  chain: Chain;
  transfers: ActionTransfers;
}) {
  return (
    <VStack gap={4}>
      {transfers.outgoing?.length ? (
        <SurfaceList
          items={[
            {
              key: 'pay',
              pad: false,
              component: (
                <UIText
                  kind="caption/accent"
                  color="var(--neutral-500)"
                  style={{ paddingBlockStart: 8 }}
                >
                  Pay
                </UIText>
              ),
            },
          ].concat(
            transfers.outgoing.map((transfer) => ({
              key: `${transfer.quantity}${transfer.price}$`,
              pad: true,
              component: (
                <TransferItem
                  address={address}
                  chain={chain}
                  transfer={transfer}
                  direction="out"
                />
              ),
            }))
          )}
        />
      ) : null}
      {transfers.incoming?.length ? (
        <Surface style={{ paddingBlock: 8, paddingInline: 12 }}>
          <UIText kind="caption/accent" color="var(--neutral-500)">
            Receive
          </UIText>
          <Spacer height={4} />
          <VStack gap={8}>
            {transfers.incoming.map((transfer) => (
              <TransferItem
                key={`${transfer.quantity}${transfer.price}$`}
                address={address}
                chain={chain}
                transfer={transfer}
                direction="in"
              />
            ))}
          </VStack>
        </Surface>
      ) : null}
    </VStack>
  );
}

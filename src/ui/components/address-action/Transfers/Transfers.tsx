import type {
  ActionTransfer,
  ActionTransfers,
  Asset,
  Direction,
  NFTAsset,
} from 'defi-sdk';
import React, { useMemo } from 'react';
import { Media } from 'src/ui/ui-kit/Media';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import type { Chain } from 'src/modules/networks/Chain';
import { AssetIcon } from 'src/ui/components/AssetIcon';
import UnknownIcon from 'jsx:src/ui/assets/actionTypes/unknown.svg';
import { getCommonQuantity } from 'src/modules/networks/asset';
import {
  getFungibleAsset,
  getNftAsset,
} from 'src/modules/ethereum/transactions/actionAsset';
import { AssetQuantity } from 'src/ui/components/AssetQuantity';
import { minus, noValueDash } from 'src/ui/shared/typography';
import { formatCurrencyValue } from 'src/shared/units/formatCurrencyValue';
import { Surface } from 'src/ui/ui-kit/Surface';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { animated, useSpring } from '@react-spring/web';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { AssetLink } from '../../AssetLink';
import { NFTLink } from '../../NFTLink';

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
  const { currency } = useCurrency();
  const commonQuantity = useMemo(
    () =>
      getCommonQuantity({
        asset: fungible,
        chain,
        baseQuantity: transfer.quantity,
      }),
    [chain, fungible, transfer.quantity]
  );
  const amountInUsd = useMemo(() => {
    if (transfer.price == null) {
      return noValueDash;
    }
    const commonQuantity = getCommonQuantity({
      asset: fungible,
      chain,
      baseQuantity: transfer.quantity,
    });
    return formatCurrencyValue(
      commonQuantity.times(transfer.price),
      'en',
      currency
    );
  }, [chain, fungible, transfer, currency]);

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
          <AssetQuantity
            sign={direction === 'in' ? '+' : minus}
            commonQuantity={commonQuantity}
          />{' '}
          <AssetLink asset={fungible} address={address} />
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
          style={{
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
          }}
        >
          <NFTLink nft={nft} />
        </UIText>
      }
      detailText={
        <UIText kind="caption/regular" color="var(--neutral-500)">
          Amount: {transfer.quantity}
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

function Appear({
  children,
  delay = 0,
}: React.PropsWithChildren<{ delay?: number }>) {
  const style = useSpring({
    from: { opacity: 0 },
    to: { opacity: 1 },
    delay,
  });
  return <animated.div style={style}>{children}</animated.div>;
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
        <Appear>
          <Surface style={{ paddingBlock: 8, paddingInline: 12 }}>
            <UIText kind="caption/accent" color="var(--neutral-500)">
              Send
            </UIText>
            <Spacer height={4} />
            <VStack gap={8}>
              {transfers.outgoing.map((transfer) => (
                <TransferItem
                  key={`${transfer.quantity}${transfer.price}$`}
                  address={address}
                  chain={chain}
                  transfer={transfer}
                  direction="out"
                />
              ))}
            </VStack>
          </Surface>
        </Appear>
      ) : null}
      {transfers.incoming?.length ? (
        <Appear delay={150}>
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
        </Appear>
      ) : null}
    </VStack>
  );
}

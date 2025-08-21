import React, { useMemo } from 'react';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { minus } from 'src/ui/shared/typography';
import { Surface } from 'src/ui/ui-kit/Surface';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { animated, useSpring } from '@react-spring/web';
import type { AnyAddressAction } from 'src/modules/ethereum/transactions/addressAction';
import type {
  FungibleOutline,
  NFTPreview,
  ActionDirection,
  Amount,
  Collection,
} from 'src/modules/zerion-api/requests/wallet-get-actions';
import { formatPriceValue } from 'src/shared/units/formatPriceValue';
import { formatTokenValue } from 'src/shared/units/formatTokenValue';
import { HStack } from 'src/ui/ui-kit/HStack';
import { TokenIcon } from 'src/ui/ui-kit/TokenIcon';
import { isUnlimitedApproval } from 'src/ui/pages/History/isUnlimitedApproval';
import { AssetAnchor } from '../../AssetLink';
import { NFTAnchor } from '../../NFTLink/NFTLink';

function AssetContent({
  fungible,
  nft,
  collection,
  direction,
  amount,
  unlimited,
  address,
}: {
  fungible: FungibleOutline | null;
  nft: NFTPreview | null;
  collection: Collection | null;
  direction: ActionDirection | null;
  amount: Amount | null;
  unlimited?: boolean;
  address: string;
}) {
  if (fungible) {
    return (
      <HStack gap={12} alignItems="center" style={{ position: 'relative' }}>
        <TokenIcon size={36} src={fungible.iconUrl} symbol={fungible.symbol} />
        <VStack gap={0}>
          <UIText
            kind="headline/h3"
            color={direction === 'in' ? 'var(--positive-500)' : undefined}
          >
            <HStack gap={4} alignItems="center">
              <span>
                {unlimited || isUnlimitedApproval(amount?.quantity)
                  ? 'Unlimited'
                  : amount?.quantity
                  ? `${
                      direction === 'out'
                        ? minus
                        : direction === 'in'
                        ? '+'
                        : ''
                    }${formatTokenValue(amount?.quantity || '0', '')}`
                  : null}
              </span>
              <AssetAnchor
                asset={fungible}
                address={address}
                title={direction == null ? fungible.name : undefined}
              />
            </HStack>
          </UIText>
          {direction != null ? (
            <UIText kind="small/regular" color="var(--neutral-500)">
              {amount?.value != null
                ? formatPriceValue(amount.value || '0', 'en', amount.currency)
                : 'N/A'}
            </UIText>
          ) : null}
        </VStack>
      </HStack>
    );
  }

  if (nft) {
    return (
      <HStack gap={12} alignItems="center">
        <TokenIcon
          size={36}
          src={nft.metadata?.content?.imagePreviewUrl}
          symbol={nft.metadata?.name || 'NFT'}
        />
        <VStack gap={0}>
          <UIText kind="headline/h3">
            <HStack gap={4} alignItems="center">
              <span>
                {amount?.quantity
                  ? `${
                      direction === 'out'
                        ? minus
                        : direction === 'in'
                        ? '+'
                        : ''
                    }${formatTokenValue(amount?.quantity || '0', '')}`
                  : null}
              </span>
              <NFTAnchor nft={nft} address={address} />
            </HStack>
          </UIText>
          <UIText kind="small/regular" color="var(--neutral-500)">
            {direction != null ? (
              <UIText kind="small/regular" color="var(--neutral-500)">
                {amount?.value != null
                  ? formatPriceValue(amount.value || '0', 'en', amount.currency)
                  : 'N/A'}
              </UIText>
            ) : null}
          </UIText>
        </VStack>
      </HStack>
    );
  }

  if (collection) {
    return (
      <HStack gap={12} alignItems="center">
        <TokenIcon
          size={36}
          src={collection.iconUrl}
          symbol={collection.name || 'Collection'}
        />
        <VStack gap={0}>
          <UIText kind="headline/h3">{collection.name}</UIText>
        </VStack>
      </HStack>
    );
  }
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

export function ActInfo({
  address,
  act,
  initialDelay,
  elementEnd,
}: {
  address: string;
  act: AnyAddressAction['acts'][number];
  initialDelay: number;
  elementEnd: React.ReactNode;
}) {
  const incomingTransfers = useMemo(
    () => act.content?.transfers?.filter(({ direction }) => direction === 'in'),
    [act.content?.transfers]
  );
  const outgoingTransfers = useMemo(
    () =>
      act.content?.transfers?.filter(({ direction }) => direction === 'out'),
    [act.content?.transfers]
  );
  const approvals = act.content?.approvals;

  const outgoingDelay = initialDelay + (approvals?.length ? 150 : 0);
  const incomingDelay =
    initialDelay +
    (outgoingTransfers?.length ? 150 : 0) +
    (approvals?.length ? 150 : 0);

  if (
    !approvals?.length &&
    !outgoingTransfers?.length &&
    !incomingTransfers?.length
  ) {
    return null;
  }

  return (
    <VStack gap={2} style={{ position: 'relative' }}>
      {approvals?.length ? (
        <Appear delay={initialDelay}>
          <Surface style={{ paddingBlock: 8, paddingInline: 12 }}>
            <UIText kind="caption/accent" color="var(--neutral-500)">
              Allow to Spend
            </UIText>
            <VStack gap={4}>
              {approvals.map((approval, index) => (
                <AssetContent
                  key={index}
                  address={address}
                  amount={approval.amount}
                  direction={null}
                  fungible={approval.fungible}
                  nft={approval.nft}
                  collection={approval.collection}
                  unlimited={approval.unlimited}
                />
              ))}
            </VStack>
          </Surface>
        </Appear>
      ) : null}
      {outgoingTransfers?.length ? (
        <Appear delay={outgoingDelay}>
          <Surface style={{ paddingBlock: 8, paddingInline: 12 }}>
            <UIText kind="caption/accent" color="var(--neutral-500)">
              Send
            </UIText>
            <VStack gap={4}>
              {outgoingTransfers.map((transfer, index) => (
                <AssetContent
                  key={index}
                  address={address}
                  amount={transfer.amount}
                  direction={transfer.direction}
                  fungible={transfer.fungible}
                  nft={transfer.nft}
                  collection={null}
                  unlimited={false}
                />
              ))}
            </VStack>
          </Surface>
        </Appear>
      ) : null}
      {incomingTransfers?.length ? (
        <Appear delay={incomingDelay}>
          <Surface style={{ paddingBlock: 8, paddingInline: 12 }}>
            <UIText kind="caption/accent" color="var(--neutral-500)">
              Receive
            </UIText>
            <Spacer height={4} />
            <VStack gap={4}>
              {incomingTransfers.map((transfer, index) => (
                <AssetContent
                  key={index}
                  address={address}
                  amount={transfer.amount}
                  direction={transfer.direction}
                  fungible={transfer.fungible}
                  nft={transfer.nft}
                  unlimited={false}
                  collection={null}
                />
              ))}
            </VStack>
          </Surface>
        </Appear>
      ) : null}
      <Appear delay={initialDelay}>
        <UIText
          kind="caption/accent"
          color="var(--neutral-500)"
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            backgroundColor: 'var(--white)',
            padding: '4px 8px',
            borderRadius: 8,
          }}
        >
          {act.type.displayValue}
        </UIText>
        {elementEnd ? (
          <div
            style={{
              position: 'absolute',
              right: 12,
              bottom: 12,
            }}
          >
            {elementEnd}
          </div>
        ) : null}
      </Appear>
    </VStack>
  );
}

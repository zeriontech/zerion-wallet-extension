import React, { useMemo } from 'react';
import type { AddressNFT } from 'defi-sdk';
import { formatCurrencyToParts } from 'src/shared/units/formatCurrencyValue';
import TickIcon from 'jsx:src/ui/assets/check.svg';
import { ViewLoading } from 'src/ui/components/ViewLoading/ViewLoading';
import { NBSP } from 'src/ui/shared/typography';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { MediaContent } from 'src/ui/ui-kit/MediaContent';
import { NeutralDecimals } from 'src/ui/ui-kit/NeutralDecimals';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { SquareElement } from 'src/ui/ui-kit/SquareElement';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import { VStack } from 'src/ui/ui-kit/VStack';
import {
  useAddressNFTDistribution,
  useNftsTotalValue,
} from 'src/ui/shared/requests/addressNfts/useNftsTotalValue';
import {
  getNftId,
  useAddressNfts,
} from 'src/ui/shared/requests/addressNfts/useAddressNfts';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { createChain } from 'src/modules/networks/Chain';
import { NetworkIcon } from 'src/ui/components/NetworkIcon';
import { NetworkSelectValue } from 'src/modules/networks/NetworkSelectValue';
import { DelayedRender } from 'src/ui/components/DelayedRender';
import { SurfaceList } from 'src/ui/ui-kit/SurfaceList';
import { CenteredFillViewportView } from 'src/ui/components/FillView/FillView';
import { EmptyView } from 'src/ui/components/EmptyView';
import { NftTabDnaBanner } from 'src/ui/DNA/components/DnaBanners';
import { useStore } from '@store-unit/react';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { getNftEntityUrl } from '../../NonFungibleToken/getEntityUrl';
import { getGrownTabMaxHeight, offsetValues } from '../getTabsOffset';
import { NetworkBalance } from '../Positions/NetworkBalance';
import * as s from './styles.module.css';

function NFTItem({
  item,
  showCollection = false,
  someHavePrice = false,
}: {
  item: AddressNFT;
  showCollection?: boolean;
  someHavePrice?: boolean;
}) {
  const { currency } = useCurrency();
  const isPrimary = useMemo(() => {
    return item.metadata.tags?.includes('#primary');
  }, [item]);

  const price = item.prices.converted?.total_floor_price;
  const { networks } = useNetworks();

  const network = networks?.getNetworkByName(createChain(item.chain));

  return (
    <UnstyledLink
      to={getNftEntityUrl(item)}
      style={{ display: 'flex' }}
      className={s.link}
    >
      <div style={{ width: '100%', position: 'relative' }}>
        <SquareElement
          style={{ position: 'relative' }}
          className={s.mediaWrapper}
          render={(style) => (
            <>
              <MediaContent
                forcePreview={true}
                content={item.metadata.content}
                alt={`${item.metadata.name} image`}
                errorStyle={
                  CSS.supports('aspect-ratio: 1 / 1')
                    ? undefined
                    : { position: 'absolute', height: '100%' }
                }
                style={{
                  ...style,
                  borderRadius: 16,
                  objectFit: 'cover',
                }}
              />
              {network ? (
                <div
                  style={{
                    borderRadius: 5,
                    overflow: 'hidden',
                    position: 'absolute',
                    bottom: 8,
                    left: 8,
                    border: '1px solid var(--white)',
                  }}
                >
                  <NetworkIcon
                    size={12}
                    name={network.name}
                    src={network.icon_url}
                  />
                </div>
              ) : null}
            </>
          )}
        />
        <Spacer height={8} />
        <VStack gap={0} style={{ marginTop: 'auto' }}>
          {showCollection ? (
            <UIText
              kind="caption/regular"
              color="var(--neutral-500)"
              style={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {item.collection?.name || 'Untitled collection'}
            </UIText>
          ) : null}
          <UIText
            kind="small/accent"
            style={{
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            }}
          >
            {item.metadata.name || 'Untitled Asset'}
          </UIText>
          {price ? (
            <UIText kind="small/accent">
              <NeutralDecimals
                parts={formatCurrencyToParts(price, 'en', currency)}
              />
            </UIText>
          ) : someHavePrice ? (
            <UIText kind="small/accent">{NBSP}</UIText>
          ) : null}
        </VStack>
        {isPrimary ? (
          <div
            style={{
              position: 'absolute',
              color: 'var(--always-white)',
              backgroundColor: 'var(--positive-500)',
              borderRadius: 10,
              height: 20,
              width: 20,
              padding: 2,
              top: 0,
              left: 0,
              boxShadow: 'var(--elevation-100)',
            }}
          >
            <TickIcon width={16} height={16} />
          </div>
        ) : null}
      </div>
    </UnstyledLink>
  );
}

export function NonFungibleTokens({
  dappChain,
  filterChain,
  onChainChange,
}: {
  dappChain: string | null;
  filterChain: string | null;
  onChainChange: (value: string | null) => void;
}) {
  const { currency } = useCurrency();
  const { ready, params, singleAddressNormalized } = useAddressParams();
  const { value: nftDistribution } = useAddressNFTDistribution({
    ...params,
    currency,
  });
  const { value: nftTotalValue } = useNftsTotalValue(params);
  const { networks } = useNetworks();

  const chainValue = filterChain || dappChain || NetworkSelectValue.All;
  const isSupportedByBackend =
    chainValue === NetworkSelectValue.All
      ? true
      : networks?.supports('nft_positions', createChain(chainValue));

  const {
    value: items,
    isLoading,
    fetchMore,
    hasNext,
  } = useAddressNfts(
    {
      ...params,
      chains:
        isSupportedByBackend && chainValue !== NetworkSelectValue.All
          ? [chainValue]
          : undefined,
      currency,
      sorted_by: 'floor_price_high',
    },
    {
      limit: 30,
      paginatedCacheMode: 'first-page',
      enabled: isSupportedByBackend,
    }
  );

  const offsetValuesState = useStore(offsetValues);

  if (!ready) {
    return null;
  }

  const nftChainValue =
    chainValue === NetworkSelectValue.All
      ? nftTotalValue
      : nftDistribution?.floor_price[chainValue];

  const emptyNetworkBalance = (
    <div
      style={{
        paddingInline: 16,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
      }}
    >
      <NetworkBalance
        dappChain={dappChain}
        filterChain={filterChain}
        onChange={onChainChange}
        value={null}
      />
    </div>
  );

  if (!isSupportedByBackend) {
    return (
      <CenteredFillViewportView
        maxHeight={getGrownTabMaxHeight(offsetValuesState)}
      >
        {emptyNetworkBalance}
        <VStack gap={4} style={{ padding: 20, textAlign: 'center' }}>
          <span style={{ fontSize: 20 }}>💔</span>
          <UIText kind="body/regular">
            NFTs for{' '}
            {networks?.getChainName(createChain(chainValue)) || chainValue} are
            not supported yet
          </UIText>
        </VStack>
      </CenteredFillViewportView>
    );
  }

  if (!items) {
    return (
      <CenteredFillViewportView
        maxHeight={getGrownTabMaxHeight(offsetValuesState)}
      >
        {emptyNetworkBalance}
        <ViewLoading kind="network" />
      </CenteredFillViewportView>
    );
  }

  if (!items?.length) {
    return (
      <CenteredFillViewportView
        maxHeight={getGrownTabMaxHeight(offsetValuesState)}
      >
        {emptyNetworkBalance}
        <DelayedRender delay={100}>
          {isLoading && isSupportedByBackend ? (
            <div style={{ paddingBlock: 40 }}>
              <ViewLoading kind="network" />
            </div>
          ) : (
            <>
              <NftTabDnaBanner
                address={singleAddressNormalized}
                style={{
                  paddingInline: 16,
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: 36,
                }}
              />
              <div style={{ width: '100%', paddingTop: 164 }}>
                <EmptyView text="No NFTs yet" />
              </div>
            </>
          )}
        </DelayedRender>
      </CenteredFillViewportView>
    );
  }

  return (
    <VStack gap={16}>
      <div style={{ paddingInline: 16 }}>
        <NetworkBalance
          dappChain={dappChain}
          filterChain={filterChain}
          onChange={onChainChange}
          value={
            nftChainValue != null ? (
              <NeutralDecimals
                parts={formatCurrencyToParts(nftChainValue, 'en', currency)}
              />
            ) : null
          }
        />
      </div>
      <NftTabDnaBanner
        address={singleAddressNormalized}
        style={{ paddingInline: 16 }}
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(112px, 1fr))',
          gridGap: 16,
          rowGap: 24,
          paddingInline: 16,
        }}
      >
        {items.map((addressNft) => (
          <NFTItem
            key={getNftId(addressNft)}
            item={addressNft}
            showCollection={true}
          />
        ))}
      </div>

      {hasNext ? (
        <SurfaceList
          items={[
            {
              key: 0,
              onClick: isLoading ? undefined : fetchMore,
              style: { height: 40 },
              component: isLoading ? (
                <DelayedRender delay={400}>
                  <ViewLoading />
                </DelayedRender>
              ) : (
                <UIText kind="body/accent" color="var(--primary)">
                  Show More
                </UIText>
              ),
            },
          ]}
        />
      ) : null}
    </VStack>
  );
}

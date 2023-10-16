import React, { useMemo } from 'react';
import { formatCurrencyToParts } from 'src/shared/units/formatCurrencyValue';
import { DnaNFTBanner } from 'src/ui/components/DnaClaim';
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
import { normalizeAddress } from 'src/shared/normalizeAddress';
import { useNftsTotalValue } from 'src/ui/shared/requests/addressNfts/useNftsTotalValue';
import {
  getNftId,
  useAddressNfts,
} from 'src/ui/shared/requests/addressNfts/useAddressNfts';
import type { AddressNFT } from 'src/ui/shared/requests/addressNfts/types';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { createChain } from 'src/modules/networks/Chain';
import { HStack } from 'src/ui/ui-kit/HStack';
import { NetworkIcon } from 'src/ui/components/NetworkIcon';
import { NetworkSelectValue } from 'src/modules/networks/NetworkSelectValue';
import { EmptyViewForNetwork } from 'src/ui/components/EmptyViewForNetwork';
import { DelayedRender } from 'src/ui/components/DelayedRender';
import { SurfaceList } from 'src/ui/ui-kit/SurfaceList';
import { CenteredFillViewportView } from 'src/ui/components/FillView/FillView';
import { getNftEntityUrl } from '../../NonFungibleToken/getEntityUrl';
import { NetworkSelect } from '../../Networks/NetworkSelect';
import { GROWN_TAB_MAX_HEIGHT } from '../getTabsOffset';
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
                  borderRadius: 8,
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
                    chainId={network.external_id}
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
                parts={formatCurrencyToParts(price, 'en', 'usd')}
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
  chain: chainValue,
  onChainChange,
}: {
  chain: string;
  onChainChange: (value: string) => void;
}) {
  const { ready, params, maybeSingleAddress } = useAddressParams();
  const { value: nftTotalValue, isLoading: totalValueIsLoading } =
    useNftsTotalValue(params);
  const { networks } = useNetworks();

  const isSupportedByBackend =
    chainValue === NetworkSelectValue.All
      ? true
      : networks?.isSupportedByBackend(createChain(chainValue));

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
      currency: 'usd',
      sorted_by: 'floor_price_high',
    },
    {
      limit: 30,
      paginatedCacheMode: 'first-page',
      enabled: isSupportedByBackend,
    }
  );

  const nftTotalValueIsReady = nftTotalValue != null || totalValueIsLoading;

  const networkSelect = (
    <NetworkSelect
      value={chainValue}
      onChange={onChainChange}
      type="overview"
      valueMaxWidth={180}
    />
  );

  if (totalValueIsLoading && isSupportedByBackend) {
    return (
      <CenteredFillViewportView maxHeight={GROWN_TAB_MAX_HEIGHT}>
        <ViewLoading kind="network" />
      </CenteredFillViewportView>
    );
  }

  if (!ready || !items || !nftTotalValueIsReady) {
    return null;
  }

  if (!isSupportedByBackend || items.length === 0) {
    return (
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', right: 16 }}>{networkSelect}</div>
        <DelayedRender delay={100}>
          {isLoading && isSupportedByBackend ? (
            <div style={{ paddingBlock: 40 }}>
              <ViewLoading kind="network" />
            </div>
          ) : (
            <VStack gap={32} style={{ width: '100%', paddingBlock: 40 }}>
              {maybeSingleAddress ? (
                <DnaNFTBanner
                  address={normalizeAddress(maybeSingleAddress || '')}
                  style={{
                    width: '100%',
                    paddingInline: 16,
                  }}
                />
              ) : null}
              <EmptyViewForNetwork
                message="No NFTs yet"
                chainValue={chainValue}
                onChainChange={onChainChange}
              />
            </VStack>
          )}
        </DelayedRender>
      </div>
    );
  }

  return (
    <VStack gap={16}>
      <HStack
        gap={4}
        justifyContent="space-between"
        alignItems="center"
        style={{
          paddingBottom: 8,
          paddingInline: 16,
        }}
      >
        <UIText kind="body/accent">
          Total Value
          {' · '}
          <NeutralDecimals
            parts={formatCurrencyToParts(nftTotalValue || 0, 'en', 'usd')}
          />
        </UIText>
        {networkSelect}
      </HStack>

      {maybeSingleAddress ? (
        <DnaNFTBanner
          address={normalizeAddress(maybeSingleAddress)}
          style={{ paddingInline: 16 }}
        />
      ) : null}

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

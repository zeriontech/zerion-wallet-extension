import React, { useMemo } from 'react';
import type { AddressNFT } from 'defi-sdk';
import { formatCurrencyToParts } from 'src/shared/units/formatCurrencyValue';
import TickIcon from 'jsx:src/ui/assets/check.svg';
import comingSoonImgSrc from 'url:src/ui/assets/coming-soon@2x.png';
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
import {
  useNetworkConfig,
  useNetworks,
} from 'src/modules/networks/useNetworks';
import { createChain } from 'src/modules/networks/Chain';
import { NetworkIcon } from 'src/ui/components/NetworkIcon';
import { NetworkSelectValue } from 'src/modules/networks/NetworkSelectValue';
import { DelayedRender } from 'src/ui/components/DelayedRender';
import { SurfaceList } from 'src/ui/ui-kit/SurfaceList';
import { CenteredFillViewportView } from 'src/ui/components/FillView/FillView';
import { EmptyView } from 'src/ui/components/EmptyView';
import {
  ENABLE_DNA_BANNERS,
  NftTabDnaBanner,
} from 'src/ui/DNA/components/DnaBanners';
import { useStore } from '@store-unit/react';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { getAddressType } from 'src/shared/wallet/classifiers';
import { isSolanaAddress } from 'src/modules/solana/shared';
import { NetworkId } from 'src/modules/networks/NetworkId';
import { BlurrableBalance } from 'src/ui/components/BlurrableBalance';
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

  const network = networks?.getByNetworkId(createChain(item.chain));

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
              <BlurrableBalance kind="small/accent" color="var(--black)">
                <NeutralDecimals
                  parts={formatCurrencyToParts(price, 'en', currency)}
                />
              </BlurrableBalance>
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
  selectedChain,
  onChainChange,
}: {
  dappChain: string | null;
  selectedChain: string | null;
  onChainChange: (value: string | null) => void;
}) {
  const { currency } = useCurrency();
  const {
    ready,
    params,
    singleAddressNormalized,
    singleAddress: address,
  } = useAddressParams();
  const { value: nftDistribution } = useAddressNFTDistribution({
    ...params,
    currency,
  });
  const { value: nftTotalValue } = useNftsTotalValue(params);
  const chainValue = selectedChain || NetworkSelectValue.All;
  const addressType = getAddressType(address);
  const showNetworkSelector = addressType === 'evm';

  // Derive a canonical chain to check nft support if current chain value is "all"
  const referenceChain =
    chainValue === NetworkSelectValue.All
      ? isSolanaAddress(singleAddressNormalized)
        ? NetworkId.Solana
        : NetworkId.Ethereum
      : chainValue;
  const { data: network } = useNetworkConfig(referenceChain);

  const isSupportedByBackend = Boolean(network?.supports_nft_positions);

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

  const emptyNetworkBalance = showNetworkSelector ? (
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
        standard={getAddressType(params.address)}
        dappChain={dappChain}
        selectedChain={selectedChain}
        onChange={onChainChange}
        value={null}
      />
    </div>
  ) : null;

  if (!isSupportedByBackend) {
    return (
      <CenteredFillViewportView
        maxHeight={getGrownTabMaxHeight(offsetValuesState)}
      >
        {emptyNetworkBalance}
        <VStack
          gap={16}
          style={{ padding: 20, textAlign: 'center', placeItems: 'center' }}
        >
          <img style={{ width: 80 }} src={comingSoonImgSrc} alt="" />
          <UIText kind="body/accent">
            {referenceChain === 'solana'
              ? 'NFTs coming soon'
              : `NFTs for ${
                  network?.name || referenceChain
                } are not supported yet`}
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
              {ENABLE_DNA_BANNERS ? (
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
              ) : null}
              <div
                style={{
                  width: '100%',
                  paddingTop: ENABLE_DNA_BANNERS ? 164 : 0,
                }}
              >
                <EmptyView>No NFTs yet</EmptyView>
              </div>
            </>
          )}
        </DelayedRender>
      </CenteredFillViewportView>
    );
  }

  return (
    <VStack gap={16}>
      {showNetworkSelector ? (
        <div style={{ paddingInline: 16 }}>
          <NetworkBalance
            dappChain={dappChain}
            selectedChain={selectedChain}
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
      ) : null}
      {ENABLE_DNA_BANNERS ? (
        <NftTabDnaBanner
          address={singleAddressNormalized}
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

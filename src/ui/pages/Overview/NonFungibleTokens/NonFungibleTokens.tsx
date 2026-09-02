import React from 'react';
import { formatCurrencyToParts } from 'src/shared/units/formatCurrencyValue';
import comingSoonImgSrc from 'url:src/ui/assets/coming-soon@2x.png';
import { ViewLoading } from 'src/ui/components/ViewLoading/ViewLoading';
import { NBSP } from 'src/ui/shared/typography';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { MediaContent, convertMediaContent } from 'src/ui/ui-kit/MediaContent';
import { NeutralDecimals } from 'src/ui/ui-kit/NeutralDecimals';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { SquareElement } from 'src/ui/ui-kit/SquareElement';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import { VStack } from 'src/ui/ui-kit/VStack';
import { useWalletPortfolio } from 'src/modules/zerion-api/hooks/useWalletPortfolio';
import { useHttpClientSource } from 'src/modules/zerion-api/hooks/useHttpClientSource';
import { useWalletNftPositions } from 'src/modules/zerion-api/hooks/useWalletNftPositions';
import type { NftPosition } from 'src/modules/zerion-api/requests/wallet-get-nft-positions';
import { useNetworkConfig } from 'src/modules/networks/useNetworks';
import { NetworkIcon } from 'src/ui/components/NetworkIcon';
import { NetworkSelectValue } from 'src/modules/networks/NetworkSelectValue';
import { DelayedRender } from 'src/ui/components/DelayedRender';
import { SurfaceList } from 'src/ui/ui-kit/SurfaceList';
import { CenteredFillViewportView } from 'src/ui/components/FillView/FillView';
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
  item: NftPosition;
  showCollection?: boolean;
  someHavePrice?: boolean;
}) {
  const { currency } = useCurrency();
  const price = item.amount.value;

  return (
    <UnstyledLink
      to={getNftEntityUrl(item.nft)}
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
                content={convertMediaContent(item.nft.metadata.content)}
                alt={`${item.nft.metadata.name} image`}
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
                  name={item.chain.name}
                  src={item.chain.iconUrl}
                />
              </div>
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
              {item.nft.collection.name || 'Untitled collection'}
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
            {item.nft.metadata.name || 'Untitled Asset'}
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
  const source = useHttpClientSource();
  const { data: portfolioResponse } = useWalletPortfolio(
    { addresses: [params.address], currency },
    { source },
    { enabled: ready }
  );
  const walletPortfolio = portfolioResponse?.data;
  const nftTotalValue = walletPortfolio?.nfts.floorPrice ?? null;
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
    data: items,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useWalletNftPositions(
    {
      addresses: [params.address],
      currency,
      sort: 'floor_price_high',
      chain:
        isSupportedByBackend && chainValue !== NetworkSelectValue.All
          ? chainValue
          : undefined,
      limit: 30,
    },
    { source },
    { enabled: ready && isSupportedByBackend }
  );

  const offsetValuesState = useStore(offsetValues);

  if (!ready) {
    return null;
  }

  const nftChainValue =
    chainValue === NetworkSelectValue.All
      ? nftTotalValue
      : walletPortfolio?.nftChainsDistribution[chainValue];

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

  if (isLoading && !items.length) {
    return (
      <CenteredFillViewportView
        maxHeight={getGrownTabMaxHeight(offsetValuesState)}
      >
        {emptyNetworkBalance}
        <ViewLoading kind="network" />
      </CenteredFillViewportView>
    );
  }

  if (!items.length) {
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
              <div style={{ width: '100%' }}>
                <VStack gap={6} style={{ textAlign: 'center', padding: 20 }}>
                  <UIText kind="headline/hero">🥺</UIText>
                  <UIText kind="small/accent" color="var(--neutral-500)">
                    No NFTs yet
                  </UIText>
                </VStack>
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
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(112px, 1fr))',
          gridGap: 16,
          rowGap: 24,
          paddingInline: 16,
        }}
      >
        {items.map((position) => (
          <NFTItem key={position.id} item={position} showCollection={true} />
        ))}
      </div>

      {hasNextPage ? (
        <SurfaceList
          items={[
            {
              key: 0,
              onClick: isFetchingNextPage ? undefined : () => fetchNextPage(),
              style: { height: 40 },
              component: isFetchingNextPage ? (
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

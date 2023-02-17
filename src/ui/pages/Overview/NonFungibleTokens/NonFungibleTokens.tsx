import { AddressNFT, DataStatus } from 'defi-sdk';
import React, { useMemo } from 'react';
import { formatCurrencyToParts } from 'src/shared/units/formatCurrencyValue';
import { EmptyView } from 'src/ui/components/EmptyView';
import { ViewLoading } from 'src/ui/components/ViewLoading/ViewLoading';
import { useAddressNfts } from 'src/ui/shared/requests/addressNfts/useAddressNftsWithDna';
import { useAddressNftTotalValue } from 'src/ui/shared/requests/addressNfts/useAddressNftTotalValue';
import { NBSP } from 'src/ui/shared/typography';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { MediaContent } from 'src/ui/ui-kit/MediaContent';
import { NeutralDecimals } from 'src/ui/ui-kit/NeutralDecimals';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { SquareElement } from 'src/ui/ui-kit/SquareElement';
import { Surface } from 'src/ui/ui-kit/Surface';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledAnchor } from 'src/ui/ui-kit/UnstyledAnchor';
import { VStack } from 'src/ui/ui-kit/VStack';

function NFTItem({
  item,
  address,
  showCollection = false,
  someHavePrice = false,
}: {
  item: AddressNFT;
  address: string | null;
  showCollection?: boolean;
  someHavePrice?: boolean;
}) {
  const { asset } = item;
  const url = useMemo(() => {
    const urlObject = new URL(`https://app.zerion.io/nfts/${asset.asset_code}`);
    if (address) {
      urlObject.searchParams.append('address', address);
    }
    return urlObject.toString();
  }, [address, asset.asset_code]);
  const price = asset.floor_price;
  return (
    <UnstyledAnchor href={url} target="_blank" style={{ display: 'flex' }}>
      <Surface padding={8} style={{ width: '100%' }}>
        <SquareElement
          render={(style) => (
            <MediaContent
              content={asset.preview.url ? asset.preview : asset.detail}
              alt={`${asset.name} image`}
              errorStyle={
                CSS.supports('aspect-ratio: 1 / 1')
                  ? undefined
                  : { position: 'absolute', height: '100%' }
              }
              style={{
                ...style,
                borderRadius: 8,
              }}
            />
          )}
        />
        <Spacer height={16} />
        <VStack gap={4} style={{ marginTop: 'auto' }}>
          {showCollection ? (
            <UIText
              kind="subtitle/s_med"
              color="var(--neutral-500)"
              style={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {asset.collection?.name || 'Untitled collection'}
            </UIText>
          ) : null}
          <UIText
            kind="subtitle/l_med"
            style={{
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            }}
          >
            {asset.name || 'Untitled Asset'}
          </UIText>
          {price ? (
            <UIText kind="subtitle/l_med">
              <NeutralDecimals
                parts={formatCurrencyToParts(price, 'en', 'usd')}
              />
            </UIText>
          ) : someHavePrice ? (
            <UIText kind="subtitle/l_med">{NBSP}</UIText>
          ) : null}
        </VStack>
      </Surface>
    </UnstyledAnchor>
  );
}

export function NonFungibleTokens() {
  const { ready, params, maybeSingleAddress } = useAddressParams();
  const { value: nftTotalValue, status } = useAddressNftTotalValue({
    ...params,
    currency: 'usd',
    value_type: 'floor_price',
  });
  const { isLoading, value: items } = useAddressNfts(
    {
      ...params,
      currency: 'usd',
    },
    { enabled: ready }
  );
  const nftTotalValueIsReady =
    nftTotalValue != null || status === DataStatus.ok;
  if (isLoading) {
    return <ViewLoading kind="network" />;
  }

  if (!ready || !items || !nftTotalValueIsReady) {
    return null;
  }
  if (items.length === 0) {
    return <EmptyView text="No NFTs yet" />;
  }
  return (
    <VStack gap={24}>
      <VStack gap={4}>
        <UIText kind="subtitle/s_med">Total Value</UIText>
        <UIText kind="h/2_med">
          <NeutralDecimals
            parts={formatCurrencyToParts(nftTotalValue || 0, 'en', 'usd')}
          />
        </UIText>
      </VStack>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gridGap: 12,
        }}
      >
        {items.map((addressNft) => (
          <NFTItem
            key={addressNft.id}
            item={addressNft}
            address={maybeSingleAddress}
            showCollection={true}
          />
        ))}
      </div>
    </VStack>
  );
}

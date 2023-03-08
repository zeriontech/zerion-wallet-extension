import { AddressNFT, DataStatus } from 'defi-sdk';
import React, { useMemo } from 'react';
import { formatCurrencyToParts } from 'src/shared/units/formatCurrencyValue';
import { EmptyView } from 'src/ui/components/EmptyView';
import { DnaNFTBanner } from 'src/ui/components/DnaClaim';
import TickIcon from 'jsx:src/ui/assets/check.svg';
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
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import { VStack } from 'src/ui/ui-kit/VStack';
import { DNA_NFT_COLLECTION_ADDRESS } from 'src/ui/components/DnaClaim/DnaBanner';
import { normalizeAddress } from 'src/shared/normalizeAddress';

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

  const isPrimary = useMemo(() => {
    return asset.tags?.includes('#primary');
  }, [asset.tags]);

  const content = (
    <Surface padding={8} style={{ width: '100%', position: 'relative' }}>
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
            zIndex: 2,
            boxShadow: 'var(--elevation-100)',
          }}
        >
          <TickIcon width={16} height={16} />
        </div>
      ) : null}
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
              objectFit: 'cover',
            }}
          />
        )}
      />
      <Spacer height={16} />
      <VStack gap={4} style={{ marginTop: 'auto' }}>
        {showCollection ? (
          <UIText
            kind="small/accent"
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
          kind="body/accent"
          style={{
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          }}
        >
          {asset.name || 'Untitled Asset'}
        </UIText>
        {price ? (
          <UIText kind="body/accent">
            <NeutralDecimals
              parts={formatCurrencyToParts(price, 'en', 'usd')}
            />
          </UIText>
        ) : someHavePrice ? (
          <UIText kind="body/accent">{NBSP}</UIText>
        ) : null}
      </VStack>
    </Surface>
  );

  return normalizeAddress(item.asset.contract_address) ===
    DNA_NFT_COLLECTION_ADDRESS ? (
    <UnstyledLink
      to={`/nft/${item.asset.asset_code}`}
      style={{ display: 'flex' }}
    >
      {content}
    </UnstyledLink>
  ) : (
    <UnstyledAnchor href={url} target="_blank" style={{ display: 'flex' }}>
      {content}
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
  const { isLoading, value: allItems } = useAddressNfts(
    {
      ...params,
      currency: 'usd',
    },
    { enabled: ready }
  );

  const { value: dnaCollectionItems } = useAddressNfts(
    {
      ...params,
      currency: 'usd',
      contract_addresses: [DNA_NFT_COLLECTION_ADDRESS],
    },
    { enabled: ready }
  );

  const items = useMemo(() => {
    return [
      ...(dnaCollectionItems || []),
      ...(allItems?.filter(
        (item) =>
          normalizeAddress(item.asset.contract_address) !==
          DNA_NFT_COLLECTION_ADDRESS
      ) || []),
    ];
  }, [allItems, dnaCollectionItems]);

  const nftTotalValueIsReady =
    nftTotalValue != null || status === DataStatus.ok;
  if (isLoading) {
    return <ViewLoading kind="network" />;
  }

  if (!ready || !items || !nftTotalValueIsReady) {
    return null;
  }
  if (items.length === 0) {
    return (
      <VStack gap={32}>
        {maybeSingleAddress ? (
          <DnaNFTBanner address={normalizeAddress(maybeSingleAddress)} />
        ) : null}

        <EmptyView text="No NFTs yet" />
      </VStack>
    );
  }
  return (
    <VStack gap={24}>
      <VStack gap={4}>
        <UIText kind="small/accent">Total Value</UIText>
        <UIText kind="headline/h1">
          <NeutralDecimals
            parts={formatCurrencyToParts(nftTotalValue || 0, 'en', 'usd')}
          />
        </UIText>
      </VStack>

      {maybeSingleAddress ? (
        <DnaNFTBanner address={normalizeAddress(maybeSingleAddress)} />
      ) : null}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(112px, 1fr))',
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

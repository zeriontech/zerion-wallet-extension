import React from 'react';
import { formatCurrencyToParts } from 'src/shared/units/formatCurrencyValue';
import { EmptyView } from 'src/ui/components/EmptyView';
import { DnaNFTBanner } from 'src/ui/components/DnaClaim';
import { ViewLoading } from 'src/ui/components/ViewLoading/ViewLoading';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { NeutralDecimals } from 'src/ui/ui-kit/NeutralDecimals';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import { VStack } from 'src/ui/ui-kit/VStack';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import { useNftsTotalValue } from 'src/ui/shared/requests/addressNfts/useNftsTotalValue';
import { useAddressNfts } from 'src/ui/shared/requests/addressNfts/useAddressNfts';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import { Button } from 'src/ui/ui-kit/Button';
import { HStack } from 'src/ui/ui-kit/HStack';
import { getNftId } from 'src/ui/shared/requests/addressNfts/getNftId';
import { getNftEntityUrl } from '../../NonFungibleToken/getEntityUrl';
import * as s from './styles.module.css';
import { NFTItem } from './NFTItem';

export function NonFungibleTokens() {
  const { ready, params, maybeSingleAddress } = useAddressParams();
  const { value: nftTotalValue, isLoading: totalValueIsLoading } =
    useNftsTotalValue(params);

  const {
    value: items,
    isLoading,
    fetchMore,
    hasNext,
  } = useAddressNfts(
    {
      ...params,
      currency: 'usd',
      sorted_by: 'floor_price_high',
    },
    { limit: 30, paginatedCacheMode: 'first-page' }
  );

  const nftTotalValueIsReady = nftTotalValue != null || totalValueIsLoading;

  if (totalValueIsLoading) {
    return <ViewLoading kind="network" />;
  }

  if (!ready || !items || !nftTotalValueIsReady) {
    return null;
  }
  if (items.length === 0) {
    return (
      <VStack gap={32}>
        {maybeSingleAddress ? (
          <div style={{ paddingInline: 'var(--column-padding-inline)' }}>
            <DnaNFTBanner address={normalizeAddress(maybeSingleAddress)} />
          </div>
        ) : null}

        <EmptyView text="No NFTs yet" />
      </VStack>
    );
  }
  return (
    <VStack gap={24} style={{ paddingInline: 'var(--column-padding-inline)' }}>
      <UIText kind="body/accent">
        Total Value
        {' · '}
        <NeutralDecimals
          parts={formatCurrencyToParts(nftTotalValue || 0, 'en', 'usd')}
        />
      </UIText>

      {maybeSingleAddress ? (
        <DnaNFTBanner address={normalizeAddress(maybeSingleAddress)} />
      ) : null}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(112px, 1fr))',
          gridGap: 12,
          rowGap: 24,
        }}
      >
        {items.map((addressNft) => (
          <UnstyledLink
            key={getNftId(addressNft)}
            to={getNftEntityUrl(addressNft)}
            style={{ display: 'flex' }}
            className={s.link}
          >
            <NFTItem item={addressNft} showCollection={true} />
          </UnstyledLink>
        ))}
      </div>

      {hasNext ? (
        <Button
          kind="regular"
          onClick={fetchMore}
          disabled={isLoading}
          style={{ paddingInline: 16 }}
        >
          <HStack gap={8} alignItems="center">
            <span>More NFTs</span>
            {isLoading ? <CircleSpinner /> : null}
          </HStack>
        </Button>
      ) : null}
    </VStack>
  );
}

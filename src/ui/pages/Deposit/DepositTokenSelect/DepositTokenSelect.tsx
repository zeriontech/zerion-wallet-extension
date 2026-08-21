import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Combobox,
  ComboboxItem,
  ComboboxList,
  ComboboxProvider,
} from '@ariakit/react';
import SearchIcon from 'jsx:src/ui/assets/search.svg';
import InfoIcon from 'jsx:src/ui/assets/info.svg';
import type { OnrampAsset } from 'src/modules/zerion-api/types/DepositFlow';
import { useDepositSuggestedTokens } from 'src/modules/zerion-api/hooks/useDepositSuggestedTokens';
import { Background } from 'src/ui/components/Background';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { PageBottom } from 'src/ui/components/PageBottom';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { TokenAndNetworkIcon } from 'src/ui/components/TokenAndNetworkIcon';
import { Button } from 'src/ui/ui-kit/Button';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Input } from 'src/ui/ui-kit/Input';
import { Tooltip, TooltipAnchor, TooltipProvider } from 'src/ui/ui-kit/Tooltip';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import { VStack } from 'src/ui/ui-kit/VStack';
import { useDebouncedCallback } from 'src/ui/shared/useDebouncedCallback';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { getOnrampEcosystem } from '../shared/ecosystem';
import * as styles from './styles.module.css';

/**
 * Carries whatever the form already had — the typed amount, most importantly —
 * so that coming here to change the token doesn't clear it.
 */
function formPathFor(asset: OnrampAsset, search: string) {
  const params = new URLSearchParams(search);
  params.set('outputFungibleId', asset.asset.id);
  params.set('outputChain', asset.chain.id);
  return `/deposit/form?${params}`;
}

function assetKey(asset: OnrampAsset) {
  return `${asset.asset.id}-${asset.chain.id}`;
}

/**
 * The one asset the backend recommends starting with — a gas token for the
 * wallet's ecosystem. Deliberately full-width rather than the web app's
 * side-by-side tiles: passing `ecosystem` narrows the list to a single entry,
 * so there is nothing to sit beside.
 */
function FeaturedAsset({
  asset,
  search,
}: {
  asset: OnrampAsset;
  search: string;
}) {
  return (
    <UnstyledLink
      to={formPathFor(asset, search)}
      className={styles.featuredTile}
    >
      <HStack gap={12} alignItems="center">
        <TokenAndNetworkIcon
          size={48}
          symbol={asset.asset.symbol}
          iconUrl={asset.asset.iconUrl}
          networkIconUrl={asset.chain.iconUrl}
          networkName={asset.chain.name}
          outlineWidth={3}
          networkIconSize={24}
        />
        <VStack gap={0}>
          <UIText kind="body/accent">{asset.asset.name}</UIText>
          <UIText kind="small/regular" color="var(--neutral-500)">
            {asset.asset.symbol} on {asset.chain.name}
          </UIText>
        </VStack>
      </HStack>
    </UnstyledLink>
  );
}

function AssetRow({ asset, search }: { asset: OnrampAsset; search: string }) {
  return (
    <ComboboxItem
      // Ariakit does not filter for us — the backend does, via `query` — but the
      // value still drives which row the arrow keys land on
      value={`${asset.asset.name} ${asset.asset.symbol} ${asset.chain.name}`}
      setValueOnClick={false}
      hideOnClick={false}
      focusOnHover
      className={styles.assetRow}
      render={<UnstyledLink to={formPathFor(asset, search)} />}
    >
      <HStack gap={12} alignItems="center">
        <TokenAndNetworkIcon
          size={36}
          symbol={asset.asset.symbol}
          iconUrl={asset.asset.iconUrl}
          networkIconUrl={asset.chain.iconUrl}
          networkName={asset.chain.name}
        />
        <VStack gap={0}>
          <UIText kind="body/accent">{asset.asset.name}</UIText>
          <UIText kind="small/regular" color="var(--neutral-500)">
            {asset.asset.symbol} on {asset.chain.name}
          </UIText>
        </VStack>
      </HStack>
    </ComboboxItem>
  );
}

function AssetRowSkeleton() {
  return (
    <div className={styles.skeletonRow}>
      <div className={styles.skeletonIcon} />
      <div className={styles.skeletonLines}>
        <div className={styles.skeletonLineLg} />
        <div className={styles.skeletonLineSm} />
      </div>
    </div>
  );
}

function GasTokenHint() {
  return (
    <TooltipProvider placement="bottom" timeout={300}>
      <TooltipAnchor
        render={
          <Button
            kind="ghost"
            size={32}
            aria-label="More Info"
            style={{ color: 'var(--neutral-500)' }}
          >
            <InfoIcon style={{ display: 'block', width: 20, height: 20 }} />
          </Button>
        }
      />
      <Tooltip className={styles.tooltip} gutter={4}>
        <VStack gap={4}>
          <UIText kind="small/accent">Get Started</UIText>
          <UIText kind="small/regular">
            To start trading, you&apos;ll need a gas token such as ETH for
            Ethereum or SOL for Solana. A gas token is what pays for transaction
            fees on the network.
            <br />
            <br />
            We&apos;ve automatically selected the most common network for this
            token, shown by the small badge next to the token icon.
          </UIText>
        </VStack>
      </Tooltip>
    </TooltipProvider>
  );
}

export function DepositTokenSelect() {
  const { singleAddress } = useAddressParams();
  const { search } = useLocation();
  // Tracked twice on purpose: the raw value branches the layout on the very
  // first keystroke, while the debounced one drives the request
  const [inputValue, setInputValue] = useState('');
  const [query, setQuery] = useState('');
  const setQueryDebounced = useDebouncedCallback(setQuery, 300);

  const suggestedTokensQuery = useDepositSuggestedTokens(
    {
      ecosystem: singleAddress ? getOnrampEcosystem(singleAddress) : undefined,
      query: query || undefined,
    },
    { enabled: Boolean(singleAddress) }
  );

  const data = suggestedTokensQuery.data?.data;
  const featuredAssets = data?.featuredAssets;
  // Both lists come back null rather than empty when a query matches nothing
  const assets = data?.assets;
  const isSearching = Boolean(inputValue);
  const showSkeleton =
    suggestedTokensQuery.isLoading ||
    (isSearching && suggestedTokensQuery.isFetching);

  const noFundingOptions =
    suggestedTokensQuery.isSuccess &&
    !isSearching &&
    !featuredAssets?.length &&
    !assets?.length;

  return (
    <Background backgroundKind="white">
      <PageColumn>
        <PageTop />
        <NavigationTitle title="Buy Crypto" />
        {noFundingOptions ? (
          <div className={styles.emptyState}>
            <UIText kind="body/regular" color="var(--neutral-500)">
              There are no funding options at the moment
            </UIText>
          </div>
        ) : (
          <ComboboxProvider
            open={true}
            focusLoop={true}
            includesBaseElement={true}
            setValue={(value) => {
              setInputValue(value);
              setQueryDebounced(value);
            }}
          >
            <VStack gap={16}>
              <VStack gap={4}>
                <HStack
                  gap={8}
                  alignItems="start"
                  justifyContent="space-between"
                  style={{ gridTemplateColumns: '1fr auto' }}
                >
                  <UIText kind="body/accent">
                    Use credit/debit card, or bank transfer to buy crypto
                  </UIText>
                  <GasTokenHint />
                </HStack>
                {isSearching ? null : (
                  <UIText kind="caption/regular" color="var(--neutral-500)">
                    To get started select one of these gas tokens.
                  </UIText>
                )}
              </VStack>

              {!isSearching && featuredAssets?.length ? (
                <VStack gap={8}>
                  {featuredAssets.map((asset) => (
                    <FeaturedAsset
                      key={assetKey(asset)}
                      asset={asset}
                      search={search}
                    />
                  ))}
                </VStack>
              ) : null}

              <div className={styles.searchWrapper}>
                <SearchIcon role="presentation" className={styles.searchIcon} />
                <Combobox
                  autoSelect="always"
                  placeholder="Search tokens..."
                  render={<Input style={{ paddingLeft: 40 }} />}
                />
              </div>

              {!isSearching && assets?.length ? (
                <UIText kind="headline/h3">Popular Tokens</UIText>
              ) : null}

              <ComboboxList
                render={<VStack gap={8} />}
                // The popup scrolls the whole page, so the list has no
                // max-height of its own the way the web app's card does
              >
                {showSkeleton ? (
                  Array.from({ length: 5 }, (_, index) => (
                    <AssetRowSkeleton key={index} />
                  ))
                ) : assets?.length ? (
                  assets.map((asset) => (
                    <AssetRow
                      key={assetKey(asset)}
                      asset={asset}
                      search={search}
                    />
                  ))
                ) : isSearching ? (
                  <div className={styles.emptyState}>
                    <UIText kind="small/regular" color="var(--neutral-500)">
                      No items match this search
                    </UIText>
                  </div>
                ) : null}
              </ComboboxList>
            </VStack>
          </ComboboxProvider>
        )}
        <PageBottom />
      </PageColumn>
    </Background>
  );
}

import { ETH, EmptyAddressPosition } from '@zeriontech/transactions';
import { useAssetsPrices } from 'defi-sdk';
import React, { useCallback, useMemo, useState } from 'react';
import type { Chain } from 'src/modules/networks/Chain';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { AssetSelect } from 'src/ui/pages/SendForm/AssetSelect';
import type { Props as AssetSelectProps } from 'src/ui/pages/SendForm/AssetSelect';
import { useAssetsInfoPaginatedQuery } from 'src/ui/shared/requests/useAssetsInfoPaginated';
import { UIText } from 'src/ui/ui-kit/UIText';
import { capitalize } from 'capitalize-ts';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import * as helperStyles from 'src/ui/style/helpers.module.css';
import { getAssetImplementationInChain } from 'src/modules/networks/asset';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { useQuery } from '@tanstack/react-query';
import type { BareAddressPosition } from 'src/shared/types/BareAddressPosition';
import { getPopularTokens } from '../../../shared/getPopularTokens';

export function MarketAssetSelect({
  chain,
  selectedItem,
  addressPositions,
  onChange,
  isLoading,
}: {
  chain: Chain;
  selectedItem: BareAddressPosition | null;
  addressPositions: BareAddressPosition[];
  onChange: AssetSelectProps['onChange'];
  isLoading?: boolean;
}) {
  // We need to save a selected item locally, because the parent component (SwapForm or BridgeForm)
  // takes time to query the newly selected position if it is not among address positions,
  // which results in a UI flicker. By storing an intermediary state, we avoid that flicker
  const [savedSelectedItem, setCurrentSelectedItem] = useState(selectedItem);
  const { currency } = useCurrency();

  const positionsMap = useMemo(
    () =>
      new Map(
        addressPositions.map((position) => [position.asset.id, position])
      ),
    [addressPositions]
  );

  const { data: popularAssetCodes, isLoading: popularAssetCodesAreLoading } =
    useQuery({
      queryKey: ['getPopularTokens', chain],
      queryFn: () => getPopularTokens(chain),
      suspense: false,
      retry: false,
      staleTime: Infinity,
    });

  const { networks } = useNetworks();
  const nativeAssetId = chain
    ? networks?.getNetworkByName(chain)?.native_asset?.id
    : ETH;

  const { data: popularAssetsResponse } = useAssetsPrices({
    currency,
    asset_codes: popularAssetCodes || [nativeAssetId || ETH],
  });

  const [query, setQuery] = useState('');
  const handleQueryDidChange = useCallback(
    (value: string) => setQuery(value),
    []
  );

  const [searchAllNetworks, setSearchAllNetworks] = useState(false);
  const shouldQueryByChain = !searchAllNetworks && chain;

  const popularPositions = useMemo(() => {
    if (!popularAssetsResponse || query || popularAssetCodesAreLoading) {
      return [];
    }
    return Object.values(popularAssetsResponse.prices)
      .map((asset) => {
        const position = positionsMap.get(asset.id);
        return position || new EmptyAddressPosition({ asset, chain });
      })
      .filter(({ asset }) => {
        return shouldQueryByChain
          ? Boolean(getAssetImplementationInChain({ chain, asset })) // exists on chain
          : true;
      });
  }, [
    chain,
    query,
    popularAssetsResponse,
    positionsMap,
    shouldQueryByChain,
    popularAssetCodesAreLoading,
  ]);

  const {
    items: marketAssets,
    hasNextPage,
    fetchNextPage,
    isLoading: marketAssetsAreLoading,
    isFetchingNextPage,
  } = useAssetsInfoPaginatedQuery(
    {
      currency,
      search_query: query,
      order_by: query ? {} : { market_cap: 'desc' },
      chain: shouldQueryByChain ? chain.toString() : null,
    },
    { suspense: false }
  );

  const popularAssetCodeSet = useMemo(
    () =>
      new Set(popularPositions.map((position) => position.asset.asset_code)),
    [popularPositions]
  );

  const marketPositions = useMemo(() => {
    if (marketAssets) {
      return marketAssets
        .filter(
          (item): item is Exclude<typeof item, null> =>
            !popularAssetCodeSet.has(item.asset.asset_code)
        )
        .map(
          (item) =>
            positionsMap.get(item.asset.id) ||
            new EmptyAddressPosition({ asset: item.asset, chain })
        );
    } else {
      return [];
    }
  }, [chain, marketAssets, popularAssetCodeSet, positionsMap]);

  const items = useMemo(
    () => [...popularPositions, ...marketPositions],
    [popularPositions, marketPositions]
  );
  const getGroupName = useCallback(
    (position: BareAddressPosition) => {
      return popularAssetCodeSet.has(position.asset.asset_code)
        ? 'Popular'
        : 'Others';
    },
    [popularAssetCodeSet]
  );

  const currentItem = selectedItem || savedSelectedItem;
  if (!currentItem) {
    return (
      <div
        style={{
          height: 24 /* height of AssetSelect */,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <svg
          viewBox="0 0 20 20"
          style={{
            display: 'block',
            width: 20,
            height: 20,
          }}
        >
          <circle r="10" cx="10" cy="10" fill="var(--neutral-300)" />
        </svg>
      </div>
    );
  }
  return (
    <AssetSelect
      items={items}
      filterItemsLocally={false}
      onChange={(item) => {
        setCurrentSelectedItem(item);
        onChange(item);
      }}
      chain={chain}
      selectedItem={currentItem}
      getGroupName={query ? undefined : getGroupName}
      pagination={{
        fetchMore: fetchNextPage,
        hasMore: Boolean(hasNextPage),
        isLoading: marketAssetsAreLoading || isFetchingNextPage,
      }}
      noItemsMessage="No assets found"
      dialogTitle="Receive"
      renderListTitle={() =>
        shouldQueryByChain ? (
          <UIText
            kind="caption/regular"
            style={{ paddingInline: 20, marginBottom: 12 }}
          >
            Showing results for{' '}
            {networks?.getChainName(chain) ?? capitalize(chain.toString())}.{' '}
            <UnstyledButton
              className={helperStyles.hoverUnderline}
              style={{ color: 'var(--primary)' }}
              onClick={() => setSearchAllNetworks(true)}
            >
              Search all networks?
            </UnstyledButton>
          </UIText>
        ) : null
      }
      onQueryDidChange={handleQueryDidChange}
      onClosed={() => setSearchAllNetworks(false)}
      isLoading={isLoading}
    />
  );
}

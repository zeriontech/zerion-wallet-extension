import { ETH, EmptyAddressPosition } from '@zeriontech/transactions';
import React, { useCallback, useMemo, useState } from 'react';
import type { Chain } from 'src/modules/networks/Chain';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { AssetSelect } from 'src/ui/pages/SendForm/AssetSelect';
import type { Props as AssetSelectProps } from 'src/ui/pages/SendForm/AssetSelect';
import { UIText } from 'src/ui/ui-kit/UIText';
import { capitalize } from 'capitalize-ts';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import * as helperStyles from 'src/ui/style/helpers.module.css';
import { getAssetImplementationInChain } from 'src/modules/networks/asset';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { useQuery } from '@tanstack/react-query';
import type { BareAddressPosition } from 'src/shared/types/BareAddressPosition';
import { useAssetListFungibles } from 'src/modules/zerion-api/hooks/useAssetListFungibles';
import { fungibleToAsset } from 'src/modules/zerion-api/requests/wallet-get-positions';
import { useSearchQueryFungibles } from 'src/modules/zerion-api/hooks/useSearchQueryFungibles';
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

  const { data: popularFungiblesData } = useAssetListFungibles({
    currency,
    fungibleIds: popularAssetCodes || [nativeAssetId || ETH],
  });

  const [query, setQuery] = useState('');
  const handleQueryDidChange = useCallback(
    (value: string) => setQuery(value),
    []
  );

  const [searchAllNetworks, setSearchAllNetworks] = useState(false);
  const shouldQueryByChain = !searchAllNetworks && chain;

  const popularPositions = useMemo(() => {
    if (!popularFungiblesData || query || popularAssetCodesAreLoading) {
      return [];
    }
    return popularFungiblesData.data
      .map((fungible) => {
        const position = positionsMap.get(fungible.id);
        return (
          position ||
          new EmptyAddressPosition({ asset: fungibleToAsset(fungible), chain })
        );
      })
      .filter(({ asset }) => {
        return shouldQueryByChain
          ? Boolean(getAssetImplementationInChain({ chain, asset })) // exists on chain
          : true;
      });
  }, [
    chain,
    query,
    popularFungiblesData,
    positionsMap,
    shouldQueryByChain,
    popularAssetCodesAreLoading,
  ]);

  const { fungibles: marketFungibles, queryData: marketFungiblesQuery } =
    useSearchQueryFungibles({
      query,
      currency,
      chain: shouldQueryByChain ? chain.toString() : undefined,
      limit: 50,
      sort: '-market_data.market_cap',
    });

  const popularAssetCodeSet = useMemo(
    () =>
      new Set(popularPositions.map((position) => position.asset.asset_code)),
    [popularPositions]
  );

  const marketPositions = useMemo(() => {
    if (marketFungibles?.length) {
      return marketFungibles
        .filter((item) => !popularAssetCodeSet.has(item.id))
        .map(
          (item) =>
            positionsMap.get(item.id) ||
            new EmptyAddressPosition({ asset: fungibleToAsset(item), chain })
        );
    } else {
      return [];
    }
  }, [chain, marketFungibles, popularAssetCodeSet, positionsMap]);

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
        fetchMore: marketFungiblesQuery.fetchNextPage,
        hasMore: Boolean(marketFungiblesQuery.hasNextPage),
        isLoading:
          marketFungiblesQuery.isLoading ||
          marketFungiblesQuery.isFetchingNextPage,
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
      isLoading={isLoading || marketFungiblesQuery.isLoading}
    />
  );
}

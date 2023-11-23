import {
  ETH,
  EmptyAddressPosition,
  popularAssetsList,
} from '@zeriontech/transactions';
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
import type { BareAddressPosition } from '../../../BareAddressPosition';

export function MarketAssetSelect({
  chain,
  selectedItem,
  addressPositions,
  onChange,
}: {
  chain: Chain;
  selectedItem: BareAddressPosition;
  addressPositions: BareAddressPosition[];
  onChange: AssetSelectProps['onChange'];
}) {
  const positionsMap = useMemo(
    () =>
      new Map(
        addressPositions.map((position) => [position.asset.id, position])
      ),
    [addressPositions]
  );
  const { networks } = useNetworks();
  const nativeAssetId = chain
    ? networks?.getNetworkByName(chain)?.native_asset?.id
    : ETH;
  const { data: popularAssetsResponse } = useAssetsPrices({
    currency: 'usd',
    asset_codes: [
      nativeAssetId !== ETH ? nativeAssetId : null,
      ...popularAssetsList,
    ].filter(Boolean) as string[],
  });

  const popularPositions = useMemo(() => {
    if (!popularAssetsResponse) {
      return [];
    }
    return Object.values(popularAssetsResponse.prices).map((asset) => {
      return (
        positionsMap.get(asset.id) || new EmptyAddressPosition({ asset, chain })
      );
    });
  }, [chain, popularAssetsResponse, positionsMap]);

  const [query, setQuery] = useState('');
  const handleQueryDidChange = useCallback(
    (value: string) => setQuery(value),
    []
  );

  const [searchAllNetworks, setSearchAllNetworks] = useState(false);
  const shouldQueryByChain = !searchAllNetworks && chain && !query;

  const {
    items: marketAssets,
    hasNextPage,
    fetchNextPage,
    isLoading,
    isFetchingNextPage,
  } = useAssetsInfoPaginatedQuery(
    {
      currency: 'usd',
      search_query: query,
      order_by: query ? {} : { market_cap: 'desc' },
      chain: shouldQueryByChain ? chain.toString() : null,
    },
    { suspense: false }
  );

  const popularAssetCodes = useMemo(
    () =>
      new Set(popularPositions.map((position) => position.asset.asset_code)),
    [popularPositions]
  );
  const marketPositions = useMemo(() => {
    if (marketAssets) {
      return marketAssets
        .filter(
          (item): item is Exclude<typeof item, null> =>
            !popularAssetCodes.has(item.asset.asset_code)
        )
        .map(
          (item) =>
            positionsMap.get(item.asset.id) ||
            new EmptyAddressPosition({ asset: item.asset, chain })
        );
    } else {
      return [];
    }
  }, [chain, marketAssets, popularAssetCodes, positionsMap]);

  const items = [...popularPositions, ...marketPositions];
  const getGroupName = useCallback(
    (position: BareAddressPosition) => {
      return popularAssetCodes.has(position.asset.asset_code)
        ? 'Popular'
        : 'Others';
    },
    [popularAssetCodes]
  );

  return (
    <AssetSelect
      items={items}
      onChange={onChange}
      chain={chain}
      selectedItem={selectedItem}
      getGroupName={getGroupName}
      pagination={{
        fetchMore: fetchNextPage,
        hasMore: Boolean(hasNextPage),
        isLoading: isLoading || isFetchingNextPage,
      }}
      noItemsMessage="No assets found"
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
    />
  );
}

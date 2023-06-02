import { isTruthy } from 'is-truthy-ts';
import groupBy from 'lodash/groupBy';
import React from 'react';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { getNetworksBySearch } from 'src/modules/ethereum/chains/requests';
import type { NetworkConfig } from 'src/modules/networks/NetworkConfig';
import type { Networks } from 'src/modules/networks/Networks';
import { EmptyView } from 'src/ui/components/EmptyView';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import CheckIcon from 'jsx:src/ui/assets/checkmark-checked.svg';
import { ViewLoading } from 'src/ui/components/ViewLoading';
import { emitter } from 'src/ui/shared/events';
import { NetworkList } from '../NetworkList';

export function SearchResults({
  query,
  networks,
}: {
  query: string;
  networks: Networks;
}) {
  const { pathname } = useLocation();
  const {
    data: itemsForQuery,
    isPreviousData,
    isLoading,
  } = useQuery(
    ['getNetworksBySearch', query],
    () => getNetworksBySearch({ query: query.trim().toLowerCase() }),
    {
      suspense: false,
      keepPreviousData: true,
      onSuccess(results) {
        emitter.emit('networksSearchResponse', query, results.length);
      },
    }
  );
  const grouped = useMemo((): null | Array<{
    title: string;
    items: NetworkConfig[];
  }> => {
    if (!itemsForQuery) {
      return null;
    }
    const groups = groupBy(itemsForQuery, (item) => {
      if (
        item.name.toLowerCase().includes('test') ||
        item.rpc_url_public?.includes('test')
      ) {
        return 'testnets';
      }
      return 'mainnets';
    });

    return [
      groups.mainnets ? { title: 'Mainnets', items: groups.mainnets } : null,
      groups.testnets ? { title: 'Testnets', items: groups.testnets } : null,
    ].filter(isTruthy);
  }, [itemsForQuery]);
  if (isLoading) {
    return <ViewLoading kind="network" />;
  }
  if (!itemsForQuery) {
    return null;
  }
  if (!grouped || !grouped.length) {
    return <EmptyView text="Nothing found" />;
  }
  return (
    <VStack gap={16} style={isPreviousData ? { opacity: 0.6 } : undefined}>
      {grouped.map(({ title, items }) => (
        <VStack key={title} gap={8}>
          <UIText kind="small/accent" color="var(--neutral-600)">
            {title}
          </UIText>
          <NetworkList
            networks={networks}
            networkList={items}
            getItemTo={(item) =>
              networks.hasNetworkById(item.external_id)
                ? `/networks/network/${
                    networks.getNetworkById(item.external_id).chain
                  }?from=${encodeURIComponent(pathname)}`
                : `/networks/create?${new URLSearchParams({
                    from: pathname,
                    network: JSON.stringify(item),
                  })}`
            }
            getItemIconEnd={(item) =>
              networks.hasNetworkById(item.external_id) ? (
                <CheckIcon
                  style={{
                    width: 20,
                    height: 20,
                    color: 'var(--positive-500)',
                  }}
                  aria-label="Already added"
                />
              ) : undefined
            }
          />
        </VStack>
      ))}
    </VStack>
  );
}

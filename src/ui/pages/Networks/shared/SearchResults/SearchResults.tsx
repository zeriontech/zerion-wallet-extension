import React from 'react';
import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { ViewLoading } from 'src/ui/components/ViewLoading';
import { useSearchNetworks } from 'src/modules/networks/useNetworks';
import { filterNetworksByQuery } from 'src/modules/ethereum/chains/filterNetworkByQuery';
import { NetworksEmptyView } from 'src/ui/components/NetworkSelectDialog/NetworksEmptyView';
import { NetworkList } from '../NetworkList';

export function SearchResults({
  query,
  showTestnets,
}: {
  query: string;
  showTestnets: boolean;
}) {
  const { pathname } = useLocation();
  const { networks, isLoading } = useSearchNetworks({ query });
  const items = useMemo(() => {
    const allNetworks = showTestnets
      ? networks?.getNetworks()
      : networks?.getMainnets();
    return allNetworks?.filter(filterNetworksByQuery(query));
  }, [query, networks, showTestnets]);

  if (isLoading || !networks) {
    return <ViewLoading kind="network" />;
  }
  if (!items?.length) {
    return <NetworksEmptyView showTestnets={showTestnets} />;
  }
  return (
    <NetworkList
      networks={networks}
      networkList={items}
      getItemTo={(item) =>
        `/networks/network/${item.id}?from=${encodeURIComponent(pathname)}`
      }
    />
  );
}

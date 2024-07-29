import React from 'react';
import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { ViewLoading } from 'src/ui/components/ViewLoading';
import { useSearchNetworks } from 'src/modules/networks/useNetworks';
import { filterNetworksByQuery } from 'src/modules/ethereum/chains/filterNetworkByQuery';
import {
  NetworksEmptyView,
  ShowTestnetsHint,
} from 'src/ui/components/NetworkSelectDialog/NetworksEmptyView';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { NetworkList } from '../NetworkList';

export function SearchResults({
  query,
  testnetMode,
}: {
  query: string;
  testnetMode: boolean;
}) {
  const { pathname } = useLocation();
  const { networks, isLoading } = useSearchNetworks({ query });
  const items = useMemo(() => {
    const allNetworks = testnetMode
      ? networks?.getNetworks()
      : networks?.getMainnets();
    return allNetworks?.filter(filterNetworksByQuery(query));
  }, [query, networks, testnetMode]);

  if (isLoading || !networks) {
    return <ViewLoading kind="network" />;
  }
  if (!items?.length) {
    return <NetworksEmptyView testnetMode={testnetMode} />;
  }
  return (
    <>
      <NetworkList
        networks={networks}
        networkList={items}
        getItemTo={(item) =>
          `/networks/network/${item.id}?from=${encodeURIComponent(pathname)}`
        }
      />
      {testnetMode ? null : (
        <>
          <Spacer height={8} />
          <ShowTestnetsHint />
        </>
      )}
    </>
  );
}

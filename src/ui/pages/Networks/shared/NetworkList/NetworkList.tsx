import React from 'react';
import { useMemo } from 'react';
import { createChain } from 'src/modules/networks/Chain';
import type { NetworkConfig } from 'src/modules/networks/NetworkConfig';
import type {
  NetworkConfigMetaData,
  Networks,
} from 'src/modules/networks/Networks';
import { NetworkIcon } from 'src/ui/components/NetworkIcon';
import { intersperce } from 'src/ui/shared/intersperce';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Media } from 'src/ui/ui-kit/Media';
import { SurfaceList } from 'src/ui/ui-kit/SurfaceList';
import { UIText } from 'src/ui/ui-kit/UIText';
import ChevronRightIcon from 'jsx:src/ui/assets/chevron-right.svg';

function getOriginUrlFromMetaData(metadata: NetworkConfigMetaData) {
  if (
    metadata.origin === globalThis.location.origin ||
    metadata.origin === 'predefined'
  ) {
    return null;
  }
  try {
    const url = new URL(metadata.origin);
    return url.hostname;
  } catch (error) {
    return metadata.origin;
  }
}

function getUpdatedFromMetadata(metadata: NetworkConfigMetaData) {
  const { updated, created } = metadata;
  return updated === created || updated === 0 ? null : metadata.updated;
}

function NetworkDetail({
  metadata,
  network,
  networks,
}: {
  metadata: Record<string, NetworkConfigMetaData>;
  network: NetworkConfig;
  networks: Networks;
}) {
  const chainId = network.external_id;
  const chain = createChain(network.chain);
  const { originUrl, updated, sourceType } = useMemo(() => {
    if (!chainId || !metadata || !metadata[chainId]) {
      return {};
    }
    const value = metadata[chainId];
    return {
      originUrl: getOriginUrlFromMetaData(value),
      updated: getUpdatedFromMetadata(value),
      sourceType: networks.getSourceType(chain),
    };
  }, [chainId, metadata, networks, chain]);
  if (!chainId || !metadata[chainId]) {
    return null;
  }
  const isCustom = sourceType === 'custom';
  return (
    <UIText kind="caption/regular" color="var(--neutral-500)">
      {intersperce(
        [
          originUrl ? (
            <span key={0}>
              Added by{' '}
              <span style={{ color: 'var(--primary)' }}>{originUrl}</span> ·{' '}
            </span>
          ) : null,
          updated && !isCustom ? (
            <span key={1}>
              Edited{' '}
              {new Intl.DateTimeFormat('en', {
                dateStyle: 'medium',
                timeStyle: 'medium',
              }).format(updated)}
            </span>
          ) : null,
        ],
        (key) => (
          <span key={key}> · </span>
        )
      )}
    </UIText>
  );
}

export function NetworkList({
  networks,
  networkList,
  getItemTo,
  getItemIcon,
}: {
  networks: Networks;
  networkList: NetworkConfig[];
  getItemTo?: (item: NetworkConfig) => string;
  getItemIcon?: (item: NetworkConfig) => React.ReactNode;
}) {
  const metadata = useMemo(() => networks.getNetworksMetaData(), [networks]);
  return (
    <SurfaceList
      items={networkList.map((network) => ({
        key: network.external_id || network.chain,
        to: getItemTo?.(network) ?? `/networks/network/${network.chain}`,
        component: (
          <HStack gap={4} justifyContent="space-between" alignItems="center">
            <Media
              image={
                <NetworkIcon // TODO: Create NetworkIcon component
                  size={24}
                  src={network.icon_url}
                  chainId={network.external_id}
                  name={network.name}
                />
              }
              text={networks.getChainName(createChain(network.name))}
              vGap={0}
              detailText={
                <NetworkDetail
                  networks={networks}
                  network={network}
                  metadata={metadata}
                />
              }
            />

            {getItemIcon?.(network) ?? (
              <ChevronRightIcon style={{ color: 'var(--neutral-400)' }} />
            )}
          </HStack>
        ),
      }))}
    />
  );
}

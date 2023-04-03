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
  metadataRecord,
  network,
  networks,
}: {
  metadataRecord: Record<string, NetworkConfigMetaData | undefined>;
  network: NetworkConfig;
  networks: Networks;
}) {
  const chainId = network.external_id;
  const chain = createChain(network.chain);
  const metadata = metadataRecord[network.chain];
  const { originUrl, updated, sourceType } = useMemo(() => {
    if (!chainId || !metadata) {
      return {};
    }
    return {
      originUrl: getOriginUrlFromMetaData(metadata),
      updated: getUpdatedFromMetadata(metadata),
      sourceType: networks.getSourceType(chain),
    };
  }, [chainId, metadata, networks, chain]);
  if (!chainId || !metadata) {
    return null;
  }
  const isCustom = sourceType === 'custom';
  return (
    <UIText
      kind="caption/regular"
      color="var(--neutral-500)"
      style={{
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
    >
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
  const metadataRecord = useMemo(
    () => networks.getNetworksMetaData(),
    [networks]
  );
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
                  metadataRecord={metadataRecord}
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

import React, { useMemo } from 'react';
import { isTruthy } from 'is-truthy-ts';
import { createChain } from 'src/modules/networks/Chain';
import type { NetworkConfig } from 'src/modules/networks/NetworkConfig';
import { Networks } from 'src/modules/networks/Networks';
import type { NetworkConfigMetaData } from 'src/modules/networks/Networks';
import { NetworkIcon } from 'src/ui/components/NetworkIcon';
import { intersperce } from 'src/ui/shared/intersperce';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Media } from 'src/ui/ui-kit/Media';
import { SurfaceItemLink, SurfaceList } from 'src/ui/ui-kit/SurfaceList';
import { UIText } from 'src/ui/ui-kit/UIText';
import ChevronRightIcon from 'jsx:src/ui/assets/chevron-right.svg';
import InvisibleIcon from 'jsx:src/ui/assets/invisible.svg';
import { LIST_ITEM_CLASS } from 'src/ui/components/NetworkSelectDialog/constants';
import { isCustomNetworkId } from 'src/modules/ethereum/chains/helpers';
import { VirtualizedSurfaceList } from 'src/ui/ui-kit/SurfaceList/VirtualizedSurfaceList';

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

function NetworkDetail({
  metadataRecord,
  network,
}: {
  metadataRecord: Record<string, NetworkConfigMetaData | undefined>;
  network: NetworkConfig;
}) {
  const metadata = metadataRecord[network.id];
  const originUrl = useMemo(() => {
    return metadata ? getOriginUrlFromMetaData(metadata) : null;
  }, [metadata]);

  if (!network.id || !metadata) {
    return null;
  }

  const { created, updated } = metadata;
  const createdFormatted = new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(created);
  const updatedFormatted = new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(updated);

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
              {isCustomNetworkId(network.id) ? 'Added' : 'Set'} by{' '}
              <span style={{ color: 'var(--primary)' }}>{originUrl}</span>
            </span>
          ) : created && created === updated ? (
            <span key={0} title={createdFormatted}>
              {isCustomNetworkId(network.id) ? 'Created' : 'Saved'}{' '}
              {createdFormatted}
            </span>
          ) : null,
          updated && updated !== created ? (
            <span key={1} title={updatedFormatted}>
              Edited {updatedFormatted}
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
  title,
  networks,
  networkList,
  getItemTo,
  getItemIconEnd,
  previousListLength = 0,
}: {
  title?: string | null;
  networks: Networks;
  networkList: NetworkConfig[];
  getItemTo?: (item: NetworkConfig) => string;
  getItemIconEnd?: (item: NetworkConfig) => React.ReactNode;
  previousListLength?: number;
}) {
  const metadataRecord = useMemo(
    () => networks.getNetworksMetaData(),
    [networks]
  );

  const items = [
    title
      ? {
          key: title,
          pad: false,
          style: {
            padding: 0,
            top: 48,
            position: 'sticky',
            zIndex: 1,
          } as const, // Just to calm down ts
          component: (
            <UIText
              kind="small/accent"
              color="var(--neutral-500)"
              style={{ paddingBlock: 8, backgroundColor: 'var(--white)' }}
            >
              {title}
            </UIText>
          ),
        }
      : null,
    ...networkList.map((network, index) => ({
      key: network.id,
      pad: false,
      isInteractive: true,
      component: (
        <SurfaceItemLink
          to={getItemTo?.(network) ?? `/networks/network/${network.id}`}
          style={{ paddingInline: 0 }}
          data-class={LIST_ITEM_CLASS}
          data-index={index + previousListLength}
        >
          <HStack
            gap={4}
            justifyContent="space-between"
            alignItems="center"
            style={{ paddingBlock: 4 }}
          >
            <Media
              image={
                <NetworkIcon
                  size={24}
                  src={network.icon_url}
                  chainId={Networks.getChainId(network)}
                  name={network.name}
                />
              }
              text={
                <UIText
                  kind="body/accent"
                  color={network.hidden ? 'var(--neutral-700)' : undefined}
                >
                  {networks.getChainName(createChain(network.name))}
                </UIText>
              }
              vGap={0}
              detailText={
                <NetworkDetail
                  network={network}
                  metadataRecord={metadataRecord}
                />
              }
            />

            <HStack gap={8} alignItems="center">
              {network.hidden ? (
                <InvisibleIcon
                  style={{
                    width: 20,
                    height: 20,
                    color: 'var(--neutral-400)',
                  }}
                />
              ) : null}
              {getItemIconEnd?.(network) ?? (
                <ChevronRightIcon style={{ color: 'var(--neutral-400)' }} />
              )}
            </HStack>
          </HStack>
        </SurfaceItemLink>
      ),
    })),
  ].filter(isTruthy);

  return items.length > 50 ? (
    <VirtualizedSurfaceList
      style={{
        paddingBlock: 0,
        ['--surface-background-color' as string]: 'transparent',
      }}
      items={items}
      estimateSize={(index) => (index === 0 && title ? 36 : 48)}
      overscan={5}
      stickyFirstElement={Boolean(title)}
    />
  ) : (
    <SurfaceList
      style={{
        paddingBlock: 0,
        ['--surface-background-color' as string]: 'transparent',
      }}
      items={items}
    />
  );
}

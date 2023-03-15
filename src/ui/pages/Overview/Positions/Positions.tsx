import type { AddressParams, AddressPosition } from 'defi-sdk';
import { useAddressPositions } from 'defi-sdk';
import React, { useCallback, useMemo, useState } from 'react';
import { getCommonQuantity } from 'src/shared/units/assetQuantity';
import { formatCurrencyValue } from 'src/shared/units/formatCurrencyValue';
import { formatTokenValue } from 'src/shared/units/formatTokenValue';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Media } from 'src/ui/ui-kit/Media';
import { TokenIcon } from 'src/ui/ui-kit/TokenIcon';
import { UIText } from 'src/ui/ui-kit/UIText';
import { Image } from 'src/ui/ui-kit/MediaFallback';
import WalletIcon from 'jsx:src/ui/assets/wallet.svg';
// import { VirtualizedSurfaceList } from 'src/ui/ui-kit/SurfaceList/VirtualizedSurfaceList';
import { Item, SurfaceList } from 'src/ui/ui-kit/SurfaceList';
import {
  DEFAULT_PROTOCOL,
  PositionsGroupType,
} from 'src/ui/components/Positions/types';
import {
  clearMissingParentIds,
  groupPositionsByName,
  groupPositionsByProtocol,
  sortPositionGroupsByTotalValue,
  sortPositionsByParentId,
  sortPositionsByValue,
} from 'src/ui/components/Positions/groupPositions';
import { VStack } from 'src/ui/ui-kit/VStack';
import {
  getChainIconURL,
  getFullPositionsValue,
  getProtocolIconURL,
  positionTypeToStringMap,
} from 'src/ui/components/Positions/helpers';
import { formatPercent } from 'src/shared/units/formatPercent/formatPercent';
import { NetworkId } from 'src/modules/networks/NetworkId';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { createChain } from 'src/modules/networks/Chain';
import { ViewLoading } from 'src/ui/components/ViewLoading';
import { EmptyView } from 'src/ui/components/EmptyView';
import { DelayedRender } from 'src/ui/components/DelayedRender';
import { httpConnectionPort } from 'src/ui/shared/channels';
import { useQuery } from 'react-query';
import { NetworkConfig } from 'src/modules/networks/NetworkConfig';
import { capitalize } from 'capitalize-ts';
import { Networks } from 'src/modules/networks/Networks';
import { ethers } from 'ethers';
import { ErrorBoundary } from 'src/ui/components/ErrorBoundary';
import { FillView } from 'src/ui/components/FillView';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import * as helperStyles from 'src/ui/style/helpers.module.css';
import { NetworkSelect } from 'src/ui/pages/Networks/NetworkSelect';
import { intersperce } from 'src/ui/shared/intersperce';

function LineToParent({
  hasPreviosNestedPosition,
}: {
  hasPreviosNestedPosition?: boolean;
}) {
  return hasPreviosNestedPosition ? (
    <svg
      style={{
        position: 'absolute',
        left: 0,
        bottom: 15,
        width: 26,
        height: 56,
      }}
    >
      <path
        d="M2 3L2 50C2 51.58 3 53 5 53L17 53"
        stroke="var(--neutral-300)"
        strokeWidth="2"
        strokeLinecap="round"
        fillOpacity="0"
      />
    </svg>
  ) : (
    <svg
      style={{
        position: 'absolute',
        left: 0,
        bottom: 15,
        width: 26,
        height: 36,
      }}
    >
      <path
        d="M2 4L2 30C2 32.2 3.8 34 6 34L17 34"
        stroke="var(--neutral-300)"
        strokeWidth="2"
        strokeLinecap="round"
        fillOpacity="0"
      />
      <circle
        cx="2"
        cy="4"
        r="1.5"
        fill="var(--neutral-300)"
        stroke="var(--neutral-300)"
      />
    </svg>
  );
}

const textOverflowStyle: React.CSSProperties = {
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
};
function AddressPositionItem({
  position,
  hasPreviosNestedPosition,
  getChainName,
  groupType,
}: {
  position: AddressPosition;
  hasPreviosNestedPosition: boolean;
  getChainName: (chain: string) => string;
  groupType: PositionsGroupType;
}) {
  const isNested = Boolean(position.parent_id);

  return (
    <div style={{ position: 'relative', paddingLeft: isNested ? 26 : 0 }}>
      {isNested ? (
        <LineToParent hasPreviosNestedPosition={hasPreviosNestedPosition} />
      ) : null}
      <HStack gap={4} justifyContent="space-between" style={{ flexGrow: 1 }}>
        <Media
          vGap={0}
          gap={12}
          image={
            <TokenIcon
              size={36}
              symbol={position.asset.symbol}
              src={position.asset.icon_url}
            />
          }
          text={
            <UIText kind="body/accent" style={textOverflowStyle}>
              {position.asset.name}
            </UIText>
          }
          detailText={
            <UIText
              kind="small/regular"
              style={{
                color: 'var(--neutral-500)',
                display: 'flex',
                gap: 4,
                alignItems: 'center',
              }}
            >
              {intersperce(
                [
                  position.chain !== NetworkId.Ethereum ? (
                    <React.Fragment key={-1}>
                      <Image
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: 2,
                          overflow: 'hidden',
                        }}
                        src={getChainIconURL(position.chain)}
                        renderError={() => (
                          <TokenIcon symbol={position.chain} size={16} />
                        )}
                      />{' '}
                      <span style={textOverflowStyle}>
                        {getChainName(position.chain)}
                      </span>
                    </React.Fragment>
                  ) : undefined,
                  groupType === PositionsGroupType.position ? (
                    <span key={-2}>
                      protocol: {position.protocol || DEFAULT_PROTOCOL}
                    </span>
                  ) : undefined,
                  position.type !== 'asset' ? (
                    <span
                      key="position-type"
                      color={
                        position.type === 'loan'
                          ? 'var(--negative-500)'
                          : 'var(--neutral-500)'
                      }
                    >
                      {positionTypeToStringMap[position.type]}
                    </span>
                  ) : position.quantity ? (
                    <span key="position-quantity" style={textOverflowStyle}>
                      {formatTokenValue(
                        getCommonQuantity({
                          asset: position.asset,
                          quantity: position.quantity,
                          chain: position.chain,
                        }),
                        position.asset.symbol
                      )}
                    </span>
                  ) : null,
                ],
                (key) => (
                  <span key={key}> · </span>
                )
              )}
            </UIText>
          }
        />
        {position.value != null ? (
          <VStack gap={0} style={{ textAlign: 'right' }}>
            <UIText kind="body/regular">
              {formatCurrencyValue(position.value, 'en', 'usd')}
            </UIText>
            {position.asset.price?.relative_change_24h ? (
              <UIText
                kind="small/regular"
                color={
                  position.asset.price.relative_change_24h < 0
                    ? 'var(--negative-500)'
                    : 'var(--positive-500)'
                }
              >
                {position.asset.price.relative_change_24h > 0 ? '+' : null}
                {`${formatPercent(
                  position.asset.price.relative_change_24h,
                  'en'
                )}%`}
              </UIText>
            ) : null}
          </VStack>
        ) : null}
      </HStack>
    </div>
  );
}

interface PreparedPositions {
  items: AddressPosition[];
  totalValue: number;
  protocols: string[];
  protocolIndex: Record<
    string,
    {
      totalValue: number;
      relativeValue: number;
      items: AddressPosition[];
      names: string[];
      nameIndex: Record<string, AddressPosition[]>;
    }
  >;
}

function usePreparedPositions({
  items: unfilteredItems,
  groupType,
}: {
  items: AddressPosition[];
  groupType: PositionsGroupType;
}): PreparedPositions {
  const items = useMemo(
    () =>
      unfilteredItems.filter((item) =>
        item.type === 'asset' ? item.is_displayable : true
      ),
    [unfilteredItems]
  );

  const totalValue = useMemo(() => getFullPositionsValue(items), [items]);
  return useMemo(() => {
    const byProtocol =
      groupType === PositionsGroupType.platform
        ? groupPositionsByProtocol(items)
        : { [DEFAULT_PROTOCOL]: items };
    const byProtocolSorted = sortPositionGroupsByTotalValue(byProtocol);
    const protocols = byProtocolSorted.map(([protocol]) => protocol);
    const protocolIndex: PreparedPositions['protocolIndex'] = {};
    for (const protocol of protocols) {
      const items = sortPositionsByValue(byProtocol[protocol]);
      const currentTotalValue = getFullPositionsValue(items);
      const byName = groupPositionsByName(items);
      const byNameSorted = sortPositionGroupsByTotalValue(byName);
      const names = byNameSorted.map(([name]) => name);
      const nameIndex: PreparedPositions['protocolIndex'][string]['nameIndex'] =
        {};
      for (const name of names) {
        nameIndex[name] = sortPositionsByParentId(
          clearMissingParentIds(byName[name])
        );
      }
      protocolIndex[protocol] = {
        totalValue: currentTotalValue,
        relativeValue:
          currentTotalValue === 0 && totalValue === 0
            ? 0
            : (currentTotalValue / totalValue) * 100,
        items,
        names,
        nameIndex,
      };
    }
    return {
      items,
      totalValue,
      protocols,
      protocolIndex,
    };
  }, [groupType, items, totalValue]);
}

function ProtocolHeading({
  protocol,
  value,
  relativeValue,
  displayImage = true,
}: {
  protocol: string;
  value: number;
  relativeValue: number;
  displayImage?: boolean;
}) {
  return (
    <HStack gap={8} alignItems="center">
      {!displayImage ? null : protocol === DEFAULT_PROTOCOL ? (
        <div
          style={{
            backgroundColor: 'var(--actions-default)',
            padding: 4,
            borderRadius: 4,
          }}
        >
          <WalletIcon
            style={{
              display: 'block',
              width: 20,
              height: 20,
              color: 'var(--always-white)',
            }}
          />
        </div>
      ) : (
        <Image
          src={getProtocolIconURL(protocol)}
          alt=""
          style={{
            width: 32,
            height: 32,
            borderRadius: 4,
            overflow: 'hidden',
          }}
          renderError={() => (
            <TokenIcon
              symbol={protocol}
              size={32}
              style={{ borderRadius: 8 }}
            />
          )}
        />
      )}
      <UIText kind="body/accent">
        {protocol}
        {' · '}
        {formatCurrencyValue(value, 'en', 'usd')}{' '}
      </UIText>
      <UIText
        inline={true}
        kind="caption/accent"
        style={{
          paddingBlock: 4,
          paddingInline: 6,
          backgroundColor: 'var(--neutral-200)',
          borderRadius: 4,
        }}
      >
        {`${formatPercent(relativeValue, 'en')}%`}
      </UIText>
    </HStack>
  );
}

function PositionsList({
  items,
  address,
  chainValue,
  onChainChange,
}: {
  items: AddressPosition[];
  address: string | null;
  chainValue: string;
  onChainChange: (value: string) => void;
}) {
  const COLLAPSED_COUNT = 8;
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const showMore = useCallback(
    (key: string) => setExpanded((expanded) => new Set(expanded).add(key)),
    []
  );
  const showLess = useCallback(
    (key: string) =>
      setExpanded((expanded) => {
        const set = new Set(expanded);
        set.delete(key);
        return set;
      }),
    []
  );
  const groupType = PositionsGroupType.platform;
  const preparedPositions = usePreparedPositions({ items, groupType });
  const { networks } = useNetworks();
  const getChainName = useCallback(
    (chain: string) => networks?.getChainName(createChain(chain)) ?? '',
    [networks]
  );

  return (
    <VStack gap={24}>
      {preparedPositions.protocols.map((protocol, index) => {
        const items: Item[] = [];
        const {
          totalValue,
          relativeValue,
          names,
          nameIndex,
          items: protocolItems,
        } = preparedPositions.protocolIndex[protocol];
        let count = 0;
        // do not hide if only one item is left
        const stopAt =
          protocolItems.length - COLLAPSED_COUNT > 1
            ? COLLAPSED_COUNT
            : protocolItems.length;
        outerBlock: for (const name of names) {
          items.push({
            key: name,
            separatorTop: false,
            pad: false,
            component: (
              <UIText
                kind="caption/accent"
                color="var(--neutral-700)"
                style={{ paddingBottom: 4, paddingTop: 12 }}
              >
                {name.toUpperCase()}
              </UIText>
            ),
          });
          for (const position of nameIndex[name]) {
            items.push({
              key: position.id,
              href: `https://app.zerion.io/tokens/${position.asset.symbol}-${
                position.asset.asset_code
              }${address ? `?address=${address}` : ''}`,
              target: '_blank',
              separatorLeadingInset: position.parent_id ? 26 : 0,
              component: (
                <AddressPositionItem
                  position={position}
                  groupType={groupType}
                  hasPreviosNestedPosition={
                    position.asset.asset_code ===
                    '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f'
                  }
                  getChainName={getChainName}
                />
              ),
            });
            count++;
            if (count >= stopAt && !expanded.has(protocol)) {
              break outerBlock;
            }
          }
        }
        if (protocolItems.length > stopAt) {
          const howMuchMore = protocolItems.length - stopAt;
          items.push({
            key: 'show-more-less',
            onClick: () => {
              if (expanded.has(protocol)) {
                showLess(protocol);
              } else {
                showMore(protocol);
              }
            },
            component: (
              <UIText kind="body/regular" color="var(--primary)">
                {expanded.has(protocol)
                  ? 'Show Less'
                  : `Show More (${howMuchMore})`}
              </UIText>
            ),
          });
        }
        return (
          <VStack gap={12} key={protocol}>
            <HStack gap={4} justifyContent="space-between" alignItems="center">
              <ProtocolHeading
                protocol={protocol}
                value={totalValue}
                relativeValue={relativeValue}
                displayImage={protocol !== DEFAULT_PROTOCOL}
              />
              {index === 0 ? (
                <NetworkSelect
                  value={chainValue}
                  onChange={onChainChange}
                  type="overview"
                  valueMaxWidth={180}
                />
              ) : null}
            </HStack>
            <SurfaceList
              style={{ position: 'relative', paddingTop: 6 }}
              // estimateSize={(index) => (index === 0 ? 52 : 60 + 1)}
              // overscan={5} // the library detects window edge incorrectly, increasing overscan just visually hides the problem
              items={items}
            />
          </VStack>
        );
      })}
    </VStack>
  );
}

function ResetNetworkButton({ onClick }: { onClick: () => void }) {
  return (
    <UnstyledButton
      // chrome://extensions is not allowed to be linked to, but
      // can be opened programmatically
      onClick={onClick}
      className={helperStyles.hoverUnderline}
    >
      <div>Show All Networks</div>
    </UnstyledButton>
  );
}

function MultiChainPositions({
  addressParams,
  chainValue,
  address,
  onChainChange,
}: {
  addressParams: AddressParams;
  chainValue: string;
  address: string | null;
  onChainChange: (value: string) => void;
}) {
  const { value, isLoading } = useAddressPositions({
    ...addressParams,
    currency: 'usd',
  });

  const positions = value?.positions;
  const items = useMemo(
    () =>
      chainValue === '' || !positions
        ? positions
        : positions.filter((position) => position.chain === chainValue),
    [chainValue, positions]
  );

  if (isLoading) {
    return <ViewLoading kind="network" />;
  }

  if (!items || items.length === 0) {
    return (
      <EmptyView
        text={
          <VStack gap={4}>
            <div>No assets yet</div>
            {chainValue !== '' ? (
              <UIText kind="small/regular" color="var(--primary)">
                <ResetNetworkButton onClick={() => onChainChange('')} />
              </UIText>
            ) : null}
          </VStack>
        }
      />
    );
  }
  return (
    <PositionsList
      address={address}
      items={items}
      chainValue={chainValue}
      onChainChange={onChainChange}
    />
  );
}

function createAddressPosition({
  balance,
  network,
}: {
  balance: string;
  network: NetworkConfig;
}): AddressPosition {
  return {
    chain: network.chain,
    value: null,
    apy: null,
    id: `${network.native_asset?.symbol}-${network.chain}-asset`,
    included_in_chart: false,
    name: 'Asset',
    quantity: balance,
    protocol: null,
    type: 'asset',
    is_displayable: true,
    asset: {
      is_displayable: true,
      type: null,
      name: network.native_asset?.name || `${capitalize(network.name)} Token`,
      symbol: network.native_asset?.symbol || '<unknown-symbol>',
      id:
        network.native_asset?.id ||
        network.native_asset?.symbol.toLowerCase() ||
        '<unknown-id>',
      asset_code:
        network.native_asset?.address ||
        network.native_asset?.symbol.toLowerCase() ||
        '<unknown-id>',
      decimals: network.native_asset?.decimals || 0,
      icon_url: network.icon_url,
      is_verified: false,
      price: null,
      implementations: {
        [network.chain]: {
          address: network.native_asset?.address ?? null,
          decimals: network.native_asset?.decimals || 0,
        },
      },
    },
    parent_id: null,
  };
}

async function getEvmAddressPositions({
  address,
  chainId,
  networks,
}: {
  address: string;
  chainId: string;
  networks: Networks;
}) {
  const balanceInHex = await httpConnectionPort.request('eth_getBalance', {
    params: [address, 'latest'],
    context: { chainId },
  });
  const network = networks.getNetworkById(chainId);
  const balance = ethers.BigNumber.from(balanceInHex).toString();
  return [createAddressPosition({ balance, network })];
}

function useEvmAddressPositions({
  address,
  chainId,
}: {
  address: string | null;
  chainId: string;
}) {
  const { networks } = useNetworks();
  return useQuery(
    ['eth_getBalance', address, chainId],
    async () => {
      return !networks || !address
        ? null
        : getEvmAddressPositions({ address, chainId, networks });
    },
    { enabled: Boolean(networks) && Boolean(address) }
  );
}

function RawChainPositions({
  addressParams,
  chainValue,
  chainId,
  address,
  onChainChange,
}: {
  addressParams: AddressParams;
  chainValue: string;
  chainId: string;
  address: string | null;
  onChainChange: (value: string) => void;
}) {
  const addressParam =
    'address' in addressParams ? addressParams.address : address;
  const { data: addressPositions, isLoading } = useEvmAddressPositions({
    address,
    chainId,
  });
  if (!addressParam) {
    return <div>Can't display this view for multiple addresss mode.</div>;
  }

  if (isLoading) {
    return <ViewLoading kind="network" />;
  }
  if (!addressPositions || !addressPositions.length) {
    return <EmptyView text="No assets found" />;
  }
  return (
    <PositionsList
      address={address}
      items={addressPositions}
      chainValue={chainValue}
      onChainChange={onChainChange}
    />
  );
}

export function Positions({
  chain: chainValue,
  onChainChange,
}: {
  chain: string;
  onChainChange: (value: string) => void;
}) {
  const { ready, params, singleAddress } = useAddressParams();
  const { networks } = useNetworks();
  if (!networks || !ready) {
    return (
      <DelayedRender delay={2000}>
        <ViewLoading kind="network" />
      </DelayedRender>
    );
  }
  const chain = createChain(chainValue);
  const isSupportedByBackend =
    chainValue === ''
      ? true
      : networks.isSupportedByBackend(createChain(chainValue));
  if (isSupportedByBackend) {
    return (
      <MultiChainPositions
        addressParams={params}
        address={singleAddress}
        chainValue={chainValue}
        onChainChange={onChainChange}
      />
    );
  } else {
    const network = networks.getNetworkByName(chain);
    if (!network || !network.external_id) {
      throw new Error(`Custom network must have an external_id: ${chainValue}`);
    }

    return (
      <ErrorBoundary
        renderError={() => (
          <FillView>
            <VStack gap={4} style={{ padding: 20, textAlign: 'center' }}>
              <span style={{ fontSize: 20 }}>💔</span>
              <UIText kind="body/regular">
                Error fetching for {chainValue}
              </UIText>
              <UIText kind="small/regular" color="var(--primary)">
                <ResetNetworkButton onClick={() => onChainChange('')} />
              </UIText>
            </VStack>
          </FillView>
        )}
      >
        <RawChainPositions
          addressParams={params}
          address={singleAddress}
          chainValue={chainValue}
          chainId={network.external_id}
          onChainChange={onChainChange}
        />
      </ErrorBoundary>
    );
  }
}

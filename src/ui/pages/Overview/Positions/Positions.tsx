import type {
  AddressParams,
  AddressPosition,
  AddressPositionDappInfo,
} from 'defi-sdk';
import { useAddressPositions } from 'defi-sdk';
import React, { useCallback, useMemo, useState } from 'react';
import {
  formatCurrencyToParts,
  formatCurrencyValue,
} from 'src/shared/units/formatCurrencyValue';
import { formatTokenValue } from 'src/shared/units/formatTokenValue';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Media } from 'src/ui/ui-kit/Media';
import { TokenIcon } from 'src/ui/ui-kit/TokenIcon';
import { UIText } from 'src/ui/ui-kit/UIText';
import WalletIcon from 'jsx:src/ui/assets/wallet.svg';
import GasIcon from 'jsx:src/ui/assets/gas.svg';
// import { VirtualizedSurfaceList } from 'src/ui/ui-kit/SurfaceList/VirtualizedSurfaceList';
import type { Item } from 'src/ui/ui-kit/SurfaceList';
import { SurfaceList } from 'src/ui/ui-kit/SurfaceList';
import {
  DEFAULT_NAME,
  DEFAULT_PROTOCOL_ID,
  DEFAULT_PROTOCOL_NAME,
  PositionsGroupType,
} from 'src/ui/components/Positions/types';
import {
  clearMissingParentIds,
  groupPositionsByName,
  groupPositionsByDapp,
  sortPositionGroupsByTotalValue,
  sortPositionsByParentId,
  sortPositionsByValue,
} from 'src/ui/components/Positions/groupPositions';
import { VStack } from 'src/ui/ui-kit/VStack';
import {
  getFullPositionsValue,
  positionTypeToStringMap,
} from 'src/ui/components/Positions/helpers';
import { formatPercent } from 'src/shared/units/formatPercent/formatPercent';
import { NetworkId } from 'src/modules/networks/NetworkId';
import { useNetworks } from 'src/modules/networks/useNetworks';
import type { Chain } from 'src/modules/networks/Chain';
import { createChain } from 'src/modules/networks/Chain';
import { ViewLoading } from 'src/ui/components/ViewLoading';
import { DelayedRender } from 'src/ui/components/DelayedRender';
import { walletPort } from 'src/ui/shared/channels';
import { useQuery } from '@tanstack/react-query';
import { ErrorBoundary } from 'src/ui/components/ErrorBoundary';
import { FillView } from 'src/ui/components/FillView';
import { NetworkSelect } from 'src/ui/pages/Networks/NetworkSelect';
import { intersperce } from 'src/ui/shared/intersperce';
import { NetworkResetButton } from 'src/ui/components/NetworkResetButton';
import { NetworkSelectValue } from 'src/modules/networks/NetworkSelectValue';
import { EmptyViewForNetwork } from 'src/ui/components/EmptyViewForNetwork';
import { NetworkIcon } from 'src/ui/components/NetworkIcon';
import { NeutralDecimals } from 'src/ui/ui-kit/NeutralDecimals';
import { getCommonQuantity } from 'src/modules/networks/asset';
import { useRenderDelay } from 'src/ui/components/DelayedRender/DelayedRender';
import { minus } from 'src/ui/shared/typography';
import { getActiveTabOrigin } from 'src/ui/shared/requests/getActiveTabOrigin';
import { useEvmAddressPositions } from 'src/ui/shared/requests/useEvmAddressPositions';
import { CenteredFillViewportView } from 'src/ui/components/FillView/FillView';
import { GROWN_TAB_MAX_HEIGHT } from '../getTabsOffset';
import { DappLink } from './DappLink';

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
  groupType,
  showGasIcon,
}: {
  position: AddressPosition;
  groupType: PositionsGroupType;
  hasPreviosNestedPosition?: boolean;
  showGasIcon?: boolean;
}) {
  const isNested = Boolean(position.parent_id);
  const { networks } = useNetworks();
  const network = networks?.getNetworkByName(createChain(position.chain));
  const chain = createChain(position.chain);

  const relativeChange = (position.asset.price?.relative_change_24h || 0) / 100;
  const absoluteChange = Math.abs(
    position.asset.price
      ? (relativeChange * Number(position.value)) / (1 + relativeChange)
      : 0
  ).toFixed(2);

  return (
    <div
      style={{
        position: 'relative',
        paddingLeft: isNested ? 26 : 0,
        paddingRight: 4,
      }}
    >
      {isNested ? (
        <LineToParent hasPreviosNestedPosition={hasPreviosNestedPosition} />
      ) : null}
      <HStack gap={2} justifyContent="space-between" style={{ flexGrow: 1 }}>
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
            <HStack
              gap={4}
              alignItems="center"
              style={{
                gridTemplateColumns: showGasIcon ? '1fr auto' : '1fr',
                justifySelf: 'start',
              }}
              title={position.asset.name}
            >
              <UIText kind="body/accent" style={textOverflowStyle}>
                {position.asset.name}
              </UIText>
              {showGasIcon ? (
                <div title="Token is used to cover gas fees">
                  <GasIcon
                    style={{ display: 'block', width: 20, height: 20 }}
                  />
                </div>
              ) : null}
            </HStack>
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
              {position.chain !== NetworkId.Ethereum ? (
                <NetworkIcon
                  size={16}
                  name={network?.name || null}
                  chainId={network?.external_id || null}
                  src={network?.icon_url || ''}
                />
              ) : null}
              {intersperce(
                [
                  groupType === PositionsGroupType.position ? (
                    <span key={1}>
                      protocol: {position.dapp?.name || DEFAULT_PROTOCOL_NAME}
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
                          chain,
                          baseQuantity: position.quantity,
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
                {`${
                  position.asset.price.relative_change_24h > 0 ? '+' : minus
                }${formatCurrencyValue(
                  absoluteChange,
                  'en',
                  'usd'
                )} (${formatPercent(
                  position.asset.price.relative_change_24h,
                  'en'
                )}%)`}
              </UIText>
            ) : null}
          </VStack>
        ) : null}
      </HStack>
    </div>
  );
}

interface PreparedPositions {
  gasPositionId: string | null;
  items: AddressPosition[];
  totalValue: number;
  dappIds: string[];
  dappIndex: Record<
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
  const { data: tabData } = useQuery({
    queryKey: ['activeTab/origin'],
    queryFn: getActiveTabOrigin,
    suspense: false,
  });
  const tabOrigin = tabData?.tabOrigin;
  const { data: siteChain } = useQuery({
    queryKey: ['wallet/requestChainForOrigin', tabOrigin],
    queryFn: async () =>
      !tabOrigin
        ? null
        : walletPort
            .request('requestChainForOrigin', { origin: tabOrigin })
            .then((chain) => createChain(chain)),
    enabled: Boolean(tabOrigin),
    suspense: false,
  });
  const { networks } = useNetworks();
  const nativeAssetId = useMemo(() => {
    if (!siteChain) {
      return null;
    }
    const network = networks?.getNetworkByName(siteChain);
    return network?.native_asset?.id || null;
  }, [networks, siteChain]);

  const items = useMemo(
    () =>
      unfilteredItems.filter((item) =>
        item.type === 'asset' ? item.is_displayable : true
      ),
    [unfilteredItems]
  );

  const gasPositionId = useMemo(() => {
    return (
      items.find(
        (item) =>
          !item.dapp &&
          item.type === 'asset' &&
          item.chain === siteChain?.toString() &&
          item.asset.id === nativeAssetId
      )?.id || null
    );
  }, [siteChain, nativeAssetId, items]);

  const totalValue = useMemo(() => getFullPositionsValue(items), [items]);
  return useMemo(() => {
    const byDapp =
      groupType === PositionsGroupType.platform
        ? groupPositionsByDapp(items)
        : { [DEFAULT_PROTOCOL_ID]: items };
    const byDappSorted = sortPositionGroupsByTotalValue(byDapp);
    const dappIds = byDappSorted.map(([dappId]) => dappId);

    // Pin Wallet group to the top of positions list
    const defaultDappIndex = dappIds.findIndex(
      (item) => item === DEFAULT_PROTOCOL_ID
    );
    if (defaultDappIndex >= 0) {
      dappIds.splice(defaultDappIndex, 1);
      dappIds.unshift(DEFAULT_PROTOCOL_ID);
    }

    const dappIndex: PreparedPositions['dappIndex'] = {};
    for (const dappId of dappIds) {
      const dappItems = sortPositionsByValue(byDapp[dappId]);
      const currentTotalValue = getFullPositionsValue(dappItems);
      const byName = groupPositionsByName(dappItems);
      const byNameSorted = sortPositionGroupsByTotalValue(byName);
      const names = byNameSorted.map(([name]) => name);
      const nameIndex: PreparedPositions['dappIndex'][string]['nameIndex'] = {};
      for (const name of names) {
        nameIndex[name] = sortPositionsByParentId(
          clearMissingParentIds(byName[name])
        );
        const gasPositionIndex = nameIndex[name].findIndex(
          (item) => item.id === gasPositionId
        );
        if (gasPositionIndex >= 0) {
          const gasPosition = nameIndex[name][gasPositionIndex];
          nameIndex[name].splice(gasPositionIndex, 1);
          nameIndex[name].unshift(gasPosition);
        }
      }
      dappIndex[dappId] = {
        totalValue: currentTotalValue,
        relativeValue:
          currentTotalValue === 0 && totalValue === 0
            ? 0
            : (currentTotalValue / totalValue) * 100,
        items: dappItems,
        names,
        nameIndex,
      };
    }
    return {
      gasPositionId,
      items,
      totalValue,
      dappIds,
      dappIndex,
    };
  }, [groupType, items, totalValue, gasPositionId]);
}

function ProtocolHeading({
  dappInfo,
  value,
  relativeValue,
  displayImage = true,
}: {
  dappInfo: AddressPositionDappInfo;
  value: number;
  relativeValue: number;
  displayImage?: boolean;
}) {
  return (
    <HStack gap={8} alignItems="center">
      {!displayImage ? null : dappInfo.id === DEFAULT_PROTOCOL_ID ? (
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
        <TokenIcon
          src={dappInfo.icon_url}
          symbol={dappInfo.name || dappInfo.id}
          size={24}
          style={{ borderRadius: 6 }}
        />
      )}
      <UIText kind="body/accent">
        {dappInfo.name || dappInfo.id}
        {' · '}
        <NeutralDecimals parts={formatCurrencyToParts(value, 'en', 'usd')} />
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

function PositionList({
  items,
  address,
  firstHeaderItemEnd,
}: {
  items: AddressPosition[];
  address: string | null;
  firstHeaderItemEnd?: React.ReactNode;
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

  return (
    <VStack gap={24}>
      {preparedPositions.dappIds.map((dappId, index) => {
        const items: Item[] = [];
        const {
          totalValue,
          relativeValue,
          names,
          nameIndex,
          items: protocolItems,
        } = preparedPositions.dappIndex[dappId];
        let dappPositionCounter = 0;
        // do not hide if only one item is left
        const stopAt =
          protocolItems.length - COLLAPSED_COUNT > 1
            ? COLLAPSED_COUNT
            : protocolItems.length;
        outerBlock: for (const name of names) {
          if (name.toUpperCase() !== DEFAULT_NAME) {
            items.push({
              key: name,
              separatorTop: false,
              pad: false,
              component: (
                <UIText
                  kind="caption/accent"
                  color="var(--neutral-700)"
                  style={{ paddingBlock: 4 }}
                >
                  {name.toUpperCase()}
                </UIText>
              ),
            });
          }
          let namePositionCounter = 0;
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
                    namePositionCounter > 0 &&
                    Boolean(nameIndex[name][namePositionCounter - 1].parent_id)
                  }
                  showGasIcon={preparedPositions.gasPositionId === position.id}
                />
              ),
            });
            namePositionCounter++;
            dappPositionCounter++;
            if (dappPositionCounter >= stopAt && !expanded.has(dappId)) {
              break outerBlock;
            }
          }
        }
        if (protocolItems.length > stopAt) {
          items.push({
            key: 'show-more-less',
            onClick: () => {
              if (expanded.has(dappId)) {
                showLess(dappId);
              } else {
                showMore(dappId);
              }
            },
            component: (
              <UIText kind="body/accent" color="var(--primary)">
                {expanded.has(dappId) ? 'Show Less Assets' : 'Show All Assets'}
              </UIText>
            ),
          });
        }

        const dappInfo: AddressPositionDappInfo = protocolItems[0].dapp || {
          id: DEFAULT_PROTOCOL_ID,
          name: DEFAULT_PROTOCOL_NAME,
          icon_url: null,
          url: null,
        };

        return (
          <VStack gap={4} key={dappId}>
            <HStack
              gap={4}
              justifyContent="space-between"
              alignItems="center"
              style={{
                paddingInline: 16,
                paddingBottom: 8,
              }}
            >
              <ProtocolHeading
                dappInfo={dappInfo}
                value={totalValue}
                relativeValue={relativeValue}
                displayImage={dappId !== DEFAULT_PROTOCOL_ID}
              />
              {index === 0 && firstHeaderItemEnd ? firstHeaderItemEnd : null}
            </HStack>
            {dappInfo.url ? (
              <DappLink dappInfo={dappInfo} style={{ marginInline: 16 }} />
            ) : null}
            <SurfaceList
              style={{ position: 'relative', paddingBlock: 0 }}
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

function MultiChainPositions({
  addressParams,
  chainValue,
  renderEmptyView,
  ...positionListProps
}: {
  addressParams: AddressParams;
  chainValue: string;
  renderEmptyView: () => React.ReactNode;
} & Omit<React.ComponentProps<typeof PositionList>, 'items'>) {
  const { value, isLoading } = useAddressPositions({
    ...addressParams,
    currency: 'usd',
  });

  const positions = value?.positions;
  const items = useMemo(
    () =>
      chainValue === NetworkSelectValue.All || !positions
        ? positions
        : positions.filter((position) => position.chain === chainValue),
    [chainValue, positions]
  );

  if (isLoading) {
    return (
      <CenteredFillViewportView maxHeight={GROWN_TAB_MAX_HEIGHT}>
        <ViewLoading kind="network" />
      </CenteredFillViewportView>
    );
  }

  if (!items || items.length === 0) {
    return renderEmptyView() as JSX.Element;
  }
  return <PositionList items={items} {...positionListProps} />;
}

function RawChainPositions({
  addressParams,
  chain,
  address,
  renderEmptyView,
  ...positionListProps
}: {
  addressParams: AddressParams;
  chain: Chain;
  renderEmptyView: () => React.ReactNode;
} & Omit<React.ComponentProps<typeof PositionList>, 'items'>) {
  const addressParam =
    'address' in addressParams ? addressParams.address : address;
  const { data: addressPositions, isLoading } = useEvmAddressPositions({
    address: addressParam,
    chain,
  });
  if (!addressParam) {
    return <div>Can't display this view for multiple addresss mode.</div>;
  }

  if (isLoading) {
    return (
      <CenteredFillViewportView maxHeight={GROWN_TAB_MAX_HEIGHT}>
        <ViewLoading kind="network" />
      </CenteredFillViewportView>
    );
  }
  if (!addressPositions || !addressPositions.length) {
    return renderEmptyView() as JSX.Element;
  }
  return (
    <PositionList
      address={address}
      items={addressPositions}
      {...positionListProps}
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
  const { ready, params, singleAddressNormalized } = useAddressParams();
  // Cheap perceived performance hack: render expensive Positions component later so that initial UI render is faster
  const readyToRender = useRenderDelay(16);
  const { networks } = useNetworks();
  if (!networks || !ready) {
    return (
      <CenteredFillViewportView maxHeight={GROWN_TAB_MAX_HEIGHT}>
        <DelayedRender delay={2000}>
          <ViewLoading kind="network" />
        </DelayedRender>
      </CenteredFillViewportView>
    );
  }
  const networkSelect = (
    <NetworkSelect
      value={chainValue}
      onChange={onChainChange}
      type="overview"
      valueMaxWidth={180}
    />
  );
  const chain = createChain(chainValue);
  const isSupportedByBackend =
    chainValue === NetworkSelectValue.All
      ? true
      : networks.isSupportedByBackend(createChain(chainValue));

  const renderEmptyViewForNetwork = () => (
    <CenteredFillViewportView maxHeight={GROWN_TAB_MAX_HEIGHT}>
      <div style={{ position: 'absolute', right: 16 }}>{networkSelect}</div>
      <DelayedRender delay={50}>
        <EmptyViewForNetwork
          message="No assets yet"
          chainValue={chainValue}
          onChainChange={onChainChange}
        />
      </DelayedRender>
    </CenteredFillViewportView>
  );
  if (!readyToRender) {
    return renderEmptyViewForNetwork();
  }
  if (isSupportedByBackend) {
    return (
      <MultiChainPositions
        addressParams={params}
        address={singleAddressNormalized}
        chainValue={chainValue}
        renderEmptyView={renderEmptyViewForNetwork}
        firstHeaderItemEnd={networkSelect}
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
                <NetworkResetButton
                  onClick={() => onChainChange(NetworkSelectValue.All)}
                />
              </UIText>
            </VStack>
          </FillView>
        )}
      >
        <RawChainPositions
          addressParams={params}
          address={singleAddressNormalized}
          chain={chain}
          renderEmptyView={renderEmptyViewForNetwork}
          firstHeaderItemEnd={networkSelect}
        />
      </ErrorBoundary>
    );
  }
}

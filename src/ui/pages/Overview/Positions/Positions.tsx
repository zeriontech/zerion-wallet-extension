import type { AddressPosition, AddressPositionDappInfo } from 'defi-sdk';
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
import WalletIcon from 'jsx:src/ui/assets/wallet-fancy.svg';
import GasIcon from 'jsx:src/ui/assets/gas.svg';
// import { VirtualizedSurfaceList } from 'src/ui/ui-kit/SurfaceList/VirtualizedSurfaceList';
import type { Item } from 'src/ui/ui-kit/SurfaceList';
import {
  SurfaceItemAnchor,
  SurfaceItemLink,
  SurfaceList,
} from 'src/ui/ui-kit/SurfaceList';
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
import { formatPercent } from 'src/shared/units/formatPercent';
import { NetworkId } from 'src/modules/networks/NetworkId';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { createChain } from 'src/modules/networks/Chain';
import { ViewLoading } from 'src/ui/components/ViewLoading';
import { DelayedRender } from 'src/ui/components/DelayedRender';
import { intersperce } from 'src/ui/shared/intersperce';
import { NetworkSelectValue } from 'src/modules/networks/NetworkSelectValue';
import { NetworkIcon } from 'src/ui/components/NetworkIcon';
import { NeutralDecimals } from 'src/ui/ui-kit/NeutralDecimals';
import { getCommonQuantity } from 'src/modules/networks/asset';
import { useRenderDelay } from 'src/ui/components/DelayedRender/DelayedRender';
import { minus } from 'src/ui/shared/typography';
import { useAddressPositionsFromNode } from 'src/ui/shared/requests/useAddressPositionsFromNode';
import { CenteredFillViewportView } from 'src/ui/components/FillView/FillView';
import { invariant } from 'src/shared/invariant';
import { ErrorBoundary } from 'src/ui/components/ErrorBoundary';
import { useStore } from '@store-unit/react';
import { usePreferences } from 'src/ui/features/preferences';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { useHttpAddressPositions } from 'src/modules/zerion-api/hooks/useWalletPositions';
import { useHttpClientSource } from 'src/modules/zerion-api/hooks/useHttpClientSource';
import { useWalletPortfolio } from 'src/modules/zerion-api/hooks/useWalletPortfolio';
import type { WalletPortfolio } from 'src/modules/zerion-api/requests/wallet-get-portfolio';
import { usePositionsRefetchInterval } from 'src/ui/transactions/usePositionsRefetchInterval';
import { openHrefInTabIfSidepanel } from 'src/ui/shared/openInTabIfInSidepanel';
import { useFirebaseConfig } from 'src/modules/remote-config/plugins/useFirebaseConfig';
import { isSolanaAddress } from 'src/modules/solana/shared';
import { getAddressType } from 'src/shared/wallet/classifiers';
import { walletPort } from 'src/ui/shared/channels';
import { useLocation } from 'react-router-dom';
import { BlurrableBalance } from 'src/ui/components/BlurrableBalance';
import {
  TAB_SELECTOR_HEIGHT,
  TAB_TOP_PADDING,
  getGrownTabMaxHeight,
  getStickyOffset,
  offsetValues,
} from '../getTabsOffset';
import { DappLink } from './DappLink';
import { NetworkBalance } from './NetworkBalance';
import { EmptyPositionsView } from './EmptyPositionsView';

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
  const { currency } = useCurrency();
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
                color: 'var(--neutral-700)',
                display: 'flex',
                gap: 4,
                alignItems: 'center',
              }}
            >
              {position.chain !== NetworkId.Ethereum ? (
                <NetworkIcon
                  size={16}
                  name={network?.name || position.chain}
                  src={network?.icon_url}
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
                    <span
                      key="position-quantity"
                      style={{ ...textOverflowStyle, display: 'flex' }}
                    >
                      <BlurrableBalance
                        kind="small/regular"
                        color="var(--neutral-700)"
                      >
                        {formatTokenValue(
                          getCommonQuantity({
                            asset: position.asset,
                            chain,
                            baseQuantity: position.quantity,
                          }),
                          position.asset.symbol
                        )}
                      </BlurrableBalance>
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
          <VStack gap={0} style={{ textAlign: 'right', justifyItems: 'end' }}>
            <UIText kind="body/regular" style={{ display: 'flex' }}>
              <BlurrableBalance kind="body/regular" color="var(--black)">
                {formatCurrencyValue(position.value, 'en', currency)}
              </BlurrableBalance>
            </UIText>
            {position.asset.price?.relative_change_24h ? (
              <UIText
                kind="small/regular"
                color={
                  position.asset.price.relative_change_24h < 0
                    ? 'var(--negative-500)'
                    : 'var(--positive-500)'
                }
                style={{ display: 'flex', gap: 4 }}
              >
                <span>
                  {`${
                    position.asset.price.relative_change_24h > 0 ? '+' : minus
                  }${formatPercent(
                    Math.abs(position.asset.price.relative_change_24h),
                    'en'
                  )}%`}
                </span>
                <BlurrableBalance
                  kind="small/regular"
                  color={
                    position.asset.price.relative_change_24h < 0
                      ? 'var(--negative-500)'
                      : 'var(--positive-500)'
                  }
                >
                  ({formatCurrencyValue(absoluteChange, 'en', currency)})
                </BlurrableBalance>
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
  items,
  groupType,
  moveGasPositionToFront,
  dappChain,
}: {
  items: AddressPosition[];
  groupType: PositionsGroupType;
  moveGasPositionToFront: boolean;
  dappChain: string | null;
}): PreparedPositions {
  const { networks } = useNetworks();
  const nativeAssetId = useMemo(() => {
    if (!dappChain) {
      return null;
    }
    const network = networks?.getNetworkByName(createChain(dappChain));
    return network?.native_asset?.id || null;
  }, [networks, dappChain]);

  const gasPositionId = useMemo(() => {
    return (
      items.find(
        (item) =>
          !item.dapp &&
          item.type === 'asset' &&
          item.chain === dappChain?.toString() &&
          item.asset.id === nativeAssetId
      )?.id || null
    );
  }, [dappChain, nativeAssetId, items]);

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
        if (moveGasPositionToFront) {
          const gasPositionIndex = nameIndex[name].findIndex(
            (item) => item.id === gasPositionId
          );
          if (gasPositionIndex >= 0) {
            const gasPosition = nameIndex[name][gasPositionIndex];
            nameIndex[name].splice(gasPositionIndex, 1);
            nameIndex[name].unshift(gasPosition);
          }
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
  }, [groupType, items, gasPositionId, totalValue, moveGasPositionToFront]);
}

function ProtocolHeading({
  dappInfo,
  relativeValue,
}: {
  dappInfo: AddressPositionDappInfo;
  value: number;
  relativeValue: number;
}) {
  return (
    <HStack gap={8} alignItems="center">
      {dappInfo.id === DEFAULT_PROTOCOL_ID ? (
        <WalletIcon />
      ) : (
        <TokenIcon
          src={dappInfo.icon_url}
          symbol={dappInfo.name || dappInfo.id}
          size={24}
          style={{ borderRadius: 6 }}
        />
      )}
      <UIText kind="body/accent">{dappInfo.name || dappInfo.id}</UIText>
      <UIText
        inline={true}
        kind="caption/accent"
        style={{
          paddingInline: 6,
          backgroundColor: 'var(--neutral-200)',
          borderRadius: 8,
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
  moveGasPositionToFront,
  dappChain,
}: {
  items: AddressPosition[];
  address: string | null;
  moveGasPositionToFront: boolean;
  dappChain: string | null;
}) {
  const COLLAPSED_COUNT = 5;
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
  const { pathname } = useLocation();
  const { preferences } = usePreferences();
  const { data: firebaseConfig } = useFirebaseConfig([
    'extension_asset_page_enabled',
  ]);

  const groupType = PositionsGroupType.platform;
  const preparedPositions = usePreparedPositions({
    items,
    groupType,
    moveGasPositionToFront,
    dappChain,
  });
  const offsetValuesState = useStore(offsetValues);
  const { currency } = useCurrency();

  const assetPageEnabled = Boolean(
    firebaseConfig?.extension_asset_page_enabled
  );

  return (
    <VStack gap={24}>
      {preparedPositions.dappIds.map((dappId, dappIndex) => {
        const items: Item[] = [];
        const {
          totalValue,
          relativeValue,
          names,
          nameIndex,
          items: protocolItems,
        } = preparedPositions.dappIndex[dappId];
        let dappPositionCounter = 0;
        let subHeadingIndex = 0;
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
                  kind="small/regular"
                  color="var(--black)"
                  style={{
                    paddingTop: subHeadingIndex > 0 ? 8 : 4,
                    paddingBottom: 4,
                    overflowWrap: 'break-word',
                  }}
                >
                  {name}
                </UIText>
              ),
            });
            subHeadingIndex += 1;
          }
          let namePositionCounter = 0;
          for (const position of nameIndex[name]) {
            const showAsLink = !preferences?.testnetMode?.on;
            const itemContent = (
              <AddressPositionItem
                position={position}
                groupType={groupType}
                hasPreviosNestedPosition={
                  namePositionCounter > 0 &&
                  Boolean(nameIndex[name][namePositionCounter - 1].parent_id)
                }
                showGasIcon={preparedPositions.gasPositionId === position.id}
              />
            );
            items.push({
              key: position.id,
              separatorLeadingInset: position.parent_id ? 26 : 0,
              pad: !assetPageEnabled && !showAsLink,
              style:
                assetPageEnabled || showAsLink ? { padding: 0 } : undefined,
              // NODE: Don't link to web in testnet mode
              // TODO: remove this conditional when we have Asset Page 100% enabled in extension
              component: assetPageEnabled ? (
                <SurfaceItemLink
                  to={`/asset/${position.asset.id}`}
                  onClick={() => {
                    walletPort.request('assetClicked', {
                      assetId: position.asset.id,
                      pathname,
                      section: 'Overview',
                    });
                  }}
                  decorationStyle={{ borderRadius: 16 }}
                >
                  {itemContent}
                </SurfaceItemLink>
              ) : showAsLink ? (
                <SurfaceItemAnchor
                  onClick={openHrefInTabIfSidepanel}
                  href={`https://app.zerion.io/tokens/${
                    position.asset.symbol
                  }-${position.asset.asset_code}${
                    address ? `?address=${address}` : ''
                  }`}
                  target="_blank"
                  decorationStyle={{ borderRadius: 16 }}
                >
                  {itemContent}
                </SurfaceItemAnchor>
              ) : (
                itemContent
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
          <VStack gap={0} key={dappId}>
            {preparedPositions.dappIds.length > 1 ? (
              <>
                <div
                  style={{
                    paddingBottom: 4,
                    paddingInline: 16,
                    position: 'sticky',
                    top:
                      getStickyOffset(offsetValuesState) +
                      TAB_SELECTOR_HEIGHT +
                      TAB_TOP_PADDING,
                    zIndex: 1,
                    backgroundColor: 'var(--white)',
                  }}
                >
                  <ProtocolHeading
                    dappInfo={dappInfo}
                    value={totalValue}
                    relativeValue={relativeValue}
                  />
                </div>
                <Spacer height={4} />
                <UIText
                  style={{ paddingInline: 16, display: 'flex' }}
                  kind="headline/h2"
                >
                  <BlurrableBalance kind="headline/h2" color="var(--black)">
                    <NeutralDecimals
                      parts={formatCurrencyToParts(totalValue, 'en', currency)}
                    />
                  </BlurrableBalance>
                </UIText>
              </>
            ) : null}
            {dappInfo.url ? (
              <>
                <Spacer height={16} />
                <DappLink dappInfo={dappInfo} style={{ marginInline: 16 }} />
                <Spacer height={16} />
              </>
            ) : (
              <Spacer height={8} />
            )}
            <SurfaceList
              style={{ position: 'relative', zIndex: 0 }}
              // estimateSize={(index) => (index === 0 ? 52 : 60 + 1)}
              // overscan={5} // the library detects window edge incorrectly, increasing overscan just visually hides the problem
              items={items}
            />
            {dappIndex !== preparedPositions.dappIds.length - 1 ? (
              <>
                <Spacer height={14} />
                <div
                  style={{
                    height: 2,
                    marginInline: 16,
                    backgroundColor: 'var(--neutral-200)',
                  }}
                />
              </>
            ) : null}
          </VStack>
        );
      })}
    </VStack>
  );
}

function MultiChainPositions({
  address,
  selectedChain,
  dappChain,
  onChainChange,
  renderEmptyView,
  renderLoadingView,
  portfolioDecomposition,
  ...positionListProps
}: {
  address: string;
  renderEmptyView: () => React.ReactNode;
  renderLoadingView: () => React.ReactNode;
  dappChain: string | null;
  selectedChain: string | null;
  onChainChange: (value: string | null) => void;
  portfolioDecomposition: WalletPortfolio | null;
} & Omit<React.ComponentProps<typeof PositionList>, 'items'>) {
  const { currency } = useCurrency();
  const { data, isLoading } = useHttpAddressPositions(
    { addresses: [address], currency },
    { source: useHttpClientSource() },
    { refetchInterval: usePositionsRefetchInterval(40000) }
  );
  const positions = data?.data;

  const chainValue = selectedChain || NetworkSelectValue.All;

  const items = useMemo(
    () =>
      positions?.filter(
        (position) =>
          (position.type === 'asset' ? position.is_displayable : true) &&
          (chainValue === NetworkSelectValue.All ||
            position.chain === chainValue)
      ),
    [chainValue, positions]
  );

  const groupedPositions = groupPositionsByDapp(items);

  if (isLoading) {
    return renderLoadingView() as JSX.Element;
  }
  if (!items || items.length === 0) {
    return renderEmptyView() as JSX.Element;
  }

  const chainTotalValue =
    chainValue === NetworkSelectValue.All
      ? portfolioDecomposition?.totalValue
      : portfolioDecomposition?.positionsChainsDistribution[chainValue];

  return (
    <VStack gap={Object.keys(groupedPositions).length > 1 ? 16 : 8}>
      <div style={{ paddingInline: 16 }}>
        <NetworkBalance
          standard={getAddressType(address)}
          dappChain={dappChain}
          selectedChain={selectedChain}
          onChange={onChainChange}
          value={
            chainTotalValue ? (
              <NeutralDecimals
                parts={formatCurrencyToParts(chainTotalValue, 'en', currency)}
              />
            ) : null
          }
        />
      </div>
      <PositionList
        items={items}
        dappChain={dappChain}
        address={address}
        {...positionListProps}
      />
    </VStack>
  );
}

function RawChainPositions({
  address,
  renderEmptyView,
  renderLoadingView,
  renderErrorView,
  selectedChain,
  dappChain,
  onChainChange,
  ...positionListProps
}: {
  address: string;
  renderEmptyView: () => React.ReactNode;
  renderLoadingView: () => React.ReactNode;
  renderErrorView: (chainName: string) => React.ReactNode;
  dappChain: string | null;
  selectedChain: string | null;
  onChainChange: (value: string | null) => void;
} & Omit<React.ComponentProps<typeof PositionList>, 'items'>) {
  const { currency } = useCurrency();
  invariant(
    selectedChain !== NetworkSelectValue.All,
    'All networks filter should not show custom chain positions'
  );
  const { networks } = useNetworks();
  const chainValue = selectedChain;
  invariant(
    chainValue,
    'Chain filter should be defined to show custom chain positions'
  );
  const chain = createChain(chainValue);
  const {
    data: addressPositions,
    isLoading,
    isError,
  } = useAddressPositionsFromNode({
    address,
    chain,
    suspense: false,
    staleTime: 1000 * 20,
  });
  if (isError) {
    return renderErrorView(
      networks?.getChainName(chain) || chainValue
    ) as JSX.Element;
  }
  if (isLoading) {
    return renderLoadingView() as JSX.Element;
  }
  if (!addressPositions || !addressPositions.length) {
    return renderEmptyView() as JSX.Element;
  }

  return (
    <VStack gap={8}>
      <div style={{ paddingInline: 16 }}>
        <NetworkBalance
          standard={getAddressType(address)}
          dappChain={dappChain}
          selectedChain={selectedChain}
          onChange={onChainChange}
          showAllNetworksOption={true}
          value={
            <NeutralDecimals
              parts={formatCurrencyToParts(
                getFullPositionsValue(addressPositions),
                'en',
                currency
              )}
            />
          }
        />
      </div>
      <PositionList
        address={address}
        items={addressPositions}
        dappChain={dappChain}
        {...positionListProps}
      />
    </VStack>
  );
}

export function Positions({
  dappChain,
  selectedChain,
  onChainChange,
}: {
  dappChain: string | null;
  selectedChain: string | null;
  onChainChange: (value: string | null) => void;
}) {
  const { currency } = useCurrency();
  const { ready, params, singleAddressNormalized } = useAddressParams();
  const addrIsSolana = isSolanaAddress(singleAddressNormalized);
  const { data, ...portfolioQuery } = useWalletPortfolio(
    { addresses: [params.address], currency },
    { source: useHttpClientSource() },
    { enabled: ready && !addrIsSolana }
  );
  const walletPortfolio = data?.data;
  const chainValue = selectedChain || NetworkSelectValue.All;
  const chain =
    chainValue === NetworkSelectValue.All ? null : createChain(chainValue);
  const positionChains = useMemo(() => {
    const chainsSet = new Set(Object.keys(walletPortfolio?.chains || {}));
    if (chainValue !== NetworkSelectValue.All) {
      chainsSet.add(chainValue);
    }
    return Array.from(chainsSet);
  }, [walletPortfolio, chainValue]);
  const offsetValuesState = useStore(offsetValues);
  // Cheap perceived performance hack: render expensive Positions component later so that initial UI render is faster
  const readyToRender = useRenderDelay(16);
  const { networks, isLoading } = useNetworks(
    positionChains.length ? positionChains : undefined
  );
  if (!ready) {
    return (
      <CenteredFillViewportView
        maxHeight={getGrownTabMaxHeight(offsetValuesState)}
      >
        <DelayedRender delay={500}>
          <ViewLoading kind="network" />
        </DelayedRender>
      </CenteredFillViewportView>
    );
  }
  const moveGasPositionToFront = chainValue !== NetworkSelectValue.All;
  const OVERRIDE_POSITIONS_SUPPORT = addrIsSolana; // todo: remove when backend updates NetworkConfig for Solana
  const isSupportedByBackend =
    chain == null
      ? true
      : OVERRIDE_POSITIONS_SUPPORT || networks?.supports('positions', chain);

  const emptyNetworkBalance = (
    <div
      style={{
        paddingInline: 16,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
      }}
    >
      <NetworkBalance
        standard={addrIsSolana ? 'solana' : 'evm'}
        dappChain={dappChain}
        selectedChain={selectedChain}
        onChange={onChainChange}
        value={null}
      />
    </div>
  );

  const renderEmptyViewForNetwork = () =>
    chainValue === NetworkSelectValue.All ? (
      <DelayedRender delay={50}>
        <VStack gap={8}>
          <div style={{ paddingInline: 16 }}>
            <NetworkBalance
              standard={addrIsSolana ? 'solana' : 'evm'}
              dappChain={dappChain}
              selectedChain={selectedChain}
              onChange={onChainChange}
              value={null}
            />
          </div>
          <EmptyPositionsView />
        </VStack>
      </DelayedRender>
    ) : (
      <CenteredFillViewportView
        maxHeight={getGrownTabMaxHeight(offsetValuesState)}
      >
        {emptyNetworkBalance}
        <DelayedRender delay={50}>
          <EmptyPositionsView />
        </DelayedRender>
      </CenteredFillViewportView>
    );
  const renderLoadingViewForNetwork = () => (
    <CenteredFillViewportView
      maxHeight={getGrownTabMaxHeight(offsetValuesState)}
    >
      {emptyNetworkBalance}
      <DelayedRender delay={50}>
        <ViewLoading kind="network" />
      </DelayedRender>
    </CenteredFillViewportView>
  );
  const renderErrorViewForNetwork = (chainName: string) => (
    <CenteredFillViewportView
      maxHeight={getGrownTabMaxHeight(offsetValuesState)}
    >
      {emptyNetworkBalance}
      <VStack gap={4} style={{ padding: 20, textAlign: 'center' }}>
        <span style={{ fontSize: 20 }}>💔</span>
        <UIText kind="body/regular">Error fetching for {chainName}</UIText>
      </VStack>
    </CenteredFillViewportView>
  );

  if (!readyToRender) {
    return renderEmptyViewForNetwork();
  }
  if (isSupportedByBackend) {
    return (
      <MultiChainPositions
        address={singleAddressNormalized}
        dappChain={dappChain}
        selectedChain={selectedChain}
        moveGasPositionToFront={moveGasPositionToFront}
        onChainChange={onChainChange}
        renderEmptyView={renderEmptyViewForNetwork}
        renderLoadingView={renderLoadingViewForNetwork}
        portfolioDecomposition={walletPortfolio || null}
      />
    );
  } else {
    if (isLoading || portfolioQuery.fetchStatus === 'fetching') {
      return renderLoadingViewForNetwork();
    }
    invariant(networks, `Failed to load network info for ${chain}`);
    const network = chain ? networks.getNetworkByName(chain) : null;
    if (!network?.id && !addrIsSolana) {
      return renderErrorViewForNetwork(chainValue);
    }

    return (
      <ErrorBoundary renderError={() => renderErrorViewForNetwork(chainValue)}>
        <RawChainPositions
          address={singleAddressNormalized}
          dappChain={dappChain}
          selectedChain={selectedChain}
          moveGasPositionToFront={moveGasPositionToFront}
          onChainChange={onChainChange}
          renderEmptyView={renderEmptyViewForNetwork}
          renderLoadingView={renderLoadingViewForNetwork}
          renderErrorView={renderErrorViewForNetwork}
        />
      </ErrorBoundary>
    );
  }
}

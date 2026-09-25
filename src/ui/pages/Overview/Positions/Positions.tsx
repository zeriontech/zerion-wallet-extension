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
import PieChartIcon from 'jsx:src/ui/assets/pie-chart.svg';
import type { Item } from 'src/ui/ui-kit/SurfaceList';
import {
  SurfaceItemAnchor,
  SurfaceItemLink,
  SurfaceList,
} from 'src/ui/ui-kit/SurfaceList';
import type {
  AppInfo,
  AppPortfolio,
  GroupedFungiblePosition,
} from 'src/ui/components/Positions/types';
import {
  DEFAULT_APP_ID,
  DEFAULT_NAME,
} from 'src/ui/components/Positions/types';
import { VStack } from 'src/ui/ui-kit/VStack';
import {
  addressPositionsToApps,
  filterDisplayableApps,
  getAppPositions,
  getFullPositionsValue,
  getPositionBalance,
  getPositionValue,
  positionTypeToStringMap,
  sortPositionsByValue,
} from 'src/ui/components/Positions/helpers';
import { formatPercent } from 'src/shared/units/formatPercent';
import { getAbsoluteChange24h } from 'src/shared/units/getAbsoluteChange24h';
import { NetworkId } from 'src/modules/networks/NetworkId';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { createChain } from 'src/modules/networks/Chain';
import { ViewLoading } from 'src/ui/components/ViewLoading';
import { DelayedRender } from 'src/ui/components/DelayedRender';
import { intersperce } from 'src/ui/shared/intersperce';
import { NetworkSelectValue } from 'src/modules/networks/NetworkSelectValue';
import { NetworkIcon } from 'src/ui/components/NetworkIcon';
import { NeutralDecimals } from 'src/ui/ui-kit/NeutralDecimals';
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
import { useWalletGroupedPositions } from 'src/modules/zerion-api/hooks/useWalletGroupedPositions';
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
  ConfidentialBalancesPanel,
  ConfidentialMask,
  hasEncryptedPositions,
  useIsSignableWallet,
} from 'src/ui/features/confidential-balances';
import {
  TAB_SELECTOR_HEIGHT,
  TAB_TOP_PADDING,
  getGrownTabMaxHeight,
  getStickyOffset,
  offsetValues,
} from '../getTabsOffset';
import { AppLink } from './AppLink';
import { NetworkBalance } from './NetworkBalance';
import { EmptyPositionsView } from './EmptyPositionsView';

const textOverflowStyle: React.CSSProperties = {
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
};

/**
 * The 24h change the value cell prints: the backend's own figure for the
 * position when it sends one, otherwise the price move applied to the value.
 */
function getPositionChange24h(position: GroupedFungiblePosition) {
  const value = getPositionValue(position);
  if (position.relativeChange24h != null) {
    const relative = position.relativeChange24h;
    const absolute = position.absoluteChange24h ?? (relative / 100) * value;
    return { relative, absolute };
  }
  const priceChange = position.asset.price?.relativeChange24h;
  if (priceChange == null) {
    return null;
  }
  return {
    relative: priceChange,
    absolute: getAbsoluteChange24h(value, priceChange / 100),
  };
}

function GroupedPositionItem({
  position,
  showGasIcon,
}: {
  position: GroupedFungiblePosition;
  showGasIcon?: boolean;
}) {
  const { currency } = useCurrency();
  // One chain, or a spread across several: the row shows the chain icon in
  // the first case and a pie icon in the second. Per-chain amounts are not
  // part of a Grouped Position; the asset page has that breakdown.
  const singleChain = position.chains.length === 1 ? position.chains[0] : null;
  const change = getPositionChange24h(position);

  return (
    <div style={{ position: 'relative', paddingRight: 4 }}>
      <HStack gap={2} justifyContent="space-between" style={{ flexGrow: 1 }}>
        <Media
          vGap={0}
          gap={12}
          image={
            <TokenIcon
              size={36}
              symbol={position.asset.symbol}
              src={position.asset.iconUrl}
            />
          }
          text={
            <HStack
              gap={4}
              alignItems="center"
              style={{
                gridTemplateColumns: `1fr${showGasIcon ? ' auto' : ''}`,
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
              {singleChain == null ? (
                <span
                  title={`${position.chains.length} networks`}
                  style={{
                    display: 'inline-flex',
                    width: 16,
                    height: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <PieChartIcon
                    style={{ display: 'block', width: 16, height: 16 }}
                  />
                </span>
              ) : singleChain.id !== NetworkId.Ethereum ? (
                <NetworkIcon
                  size={16}
                  name={singleChain.name}
                  src={singleChain.iconUrl}
                />
              ) : null}
              {intersperce(
                [
                  position.encrypted ? (
                    <span
                      key="position-quantity"
                      style={{ ...textOverflowStyle, display: 'flex' }}
                    >
                      <ConfidentialMask kind="small/regular" showLock={false} />
                    </span>
                  ) : position.type !== 'asset' ? (
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
                  ) : (
                    <span
                      key="position-quantity"
                      style={{ ...textOverflowStyle, display: 'flex' }}
                    >
                      <BlurrableBalance
                        kind="small/regular"
                        color="var(--neutral-700)"
                      >
                        {formatTokenValue(
                          getPositionBalance(position),
                          position.asset.symbol
                        )}
                      </BlurrableBalance>
                    </span>
                  ),
                ],
                (key) => (
                  <span key={key}> · </span>
                )
              )}
            </UIText>
          }
        />
        {position.encrypted ? (
          <VStack gap={0} style={{ textAlign: 'right', justifyItems: 'end' }}>
            <UIText kind="body/regular" style={{ display: 'flex' }}>
              <ConfidentialMask kind="body/regular" color="var(--black)" />
            </UIText>
          </VStack>
        ) : position.asset.price != null ? (
          <VStack gap={0} style={{ textAlign: 'right', justifyItems: 'end' }}>
            <UIText kind="body/regular" style={{ display: 'flex' }}>
              <BlurrableBalance kind="body/regular" color="var(--black)">
                {formatCurrencyValue(
                  getPositionValue(position),
                  'en',
                  currency
                )}
              </BlurrableBalance>
            </UIText>
            {change && change.relative ? (
              <UIText
                kind="small/regular"
                color={
                  change.relative < 0
                    ? 'var(--negative-500)'
                    : 'var(--positive-500)'
                }
                style={{ display: 'flex', gap: 4 }}
              >
                <span>
                  {`${change.relative > 0 ? '+' : minus}${formatPercent(
                    Math.abs(change.relative),
                    'en'
                  )}%`}
                </span>
                <BlurrableBalance
                  kind="small/regular"
                  color={
                    change.relative < 0
                      ? 'var(--negative-500)'
                      : 'var(--positive-500)'
                  }
                >
                  (
                  {formatCurrencyValue(
                    Math.abs(change.absolute).toFixed(2),
                    'en',
                    currency
                  )}
                  )
                </BlurrableBalance>
              </UIText>
            ) : null}
          </VStack>
        ) : null}
      </HStack>
    </div>
  );
}

interface PreparedApp {
  app: AppInfo;
  totalValue: number;
  relativeValue: number;
  /** Every position of the App, for counts and the all-encrypted check */
  items: GroupedFungiblePosition[];
  /** Position Group names in display order */
  names: string[];
  nameIndex: Record<string, GroupedFungiblePosition[]>;
}

interface PreparedPositions {
  gasAssetId: string | null;
  totalValue: number;
  apps: PreparedApp[];
}

/**
 * Orders the Apps (Wallet Bucket first, the rest by value) and, inside each,
 * its Position Groups by value with rows sorted by value; pins the gas token
 * of `dappChain` to the top of the Wallet Bucket when asked to.
 */
function usePreparedPositions({
  apps,
  moveGasPositionToFront,
  dappChain,
}: {
  apps: AppPortfolio[];
  moveGasPositionToFront: boolean;
  dappChain: string | null;
}): PreparedPositions {
  const { networks } = useNetworks();
  const nativeAssetId = useMemo(() => {
    if (!dappChain) {
      return null;
    }
    const network = networks?.getNetworkByName(createChain(dappChain));
    return network?.baseAsset?.id || null;
  }, [networks, dappChain]);

  return useMemo(() => {
    const totalValue = apps.reduce(
      (sum, app) => sum + getFullPositionsValue(getAppPositions(app)),
      0
    );
    const sortedApps = [...apps].sort((a, b) => {
      if (a.app.id === DEFAULT_APP_ID) {
        return -1;
      }
      if (b.app.id === DEFAULT_APP_ID) {
        return 1;
      }
      return (
        getFullPositionsValue(getAppPositions(b)) -
        getFullPositionsValue(getAppPositions(a))
      );
    });
    const preparedApps = sortedApps.map<PreparedApp>((app) => {
      const items = getAppPositions(app);
      const currentTotalValue = getFullPositionsValue(items);
      const groups = [...app.groups].sort(
        (a, b) =>
          getFullPositionsValue(b.fungiblePositions) -
          getFullPositionsValue(a.fungiblePositions)
      );
      const nameIndex: PreparedApp['nameIndex'] = {};
      for (const group of groups) {
        const name = group.name || DEFAULT_NAME;
        const rows = sortPositionsByValue(group.fungiblePositions);
        if (moveGasPositionToFront && app.app.id === DEFAULT_APP_ID) {
          const gasPositionIndex = rows.findIndex(
            (item) =>
              item.asset.id === nativeAssetId &&
              item.chains.some((chain) => chain.id === dappChain)
          );
          if (gasPositionIndex >= 0) {
            const [gasPosition] = rows.splice(gasPositionIndex, 1);
            rows.unshift(gasPosition);
          }
        }
        nameIndex[name] = [...(nameIndex[name] ?? []), ...rows];
      }
      return {
        app: app.app,
        totalValue: currentTotalValue,
        relativeValue:
          currentTotalValue === 0 && totalValue === 0
            ? 0
            : (currentTotalValue / totalValue) * 100,
        items,
        names: Object.keys(nameIndex),
        nameIndex,
      };
    });
    return { gasAssetId: nativeAssetId, totalValue, apps: preparedApps };
  }, [apps, nativeAssetId, dappChain, moveGasPositionToFront]);
}

function AppHeading({
  app,
  value,
  relativeValue,
  currency,
  allEncrypted,
}: {
  app: AppInfo;
  value: number;
  relativeValue: number;
  currency: string;
  /** Every position in the group is encrypted: the total is unknown, so it is not shown */
  allEncrypted: boolean;
}) {
  return (
    <HStack gap={8} alignItems="center">
      {app.id === DEFAULT_APP_ID ? (
        <WalletIcon />
      ) : (
        <TokenIcon
          src={app.iconUrl}
          symbol={app.name || app.id}
          size={24}
          style={{ borderRadius: 6 }}
        />
      )}
      <UIText
        kind="body/accent"
        style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        <span>{app.name || app.id}</span>
        {allEncrypted ? null : (
          <>
            <span style={{ color: 'var(--neutral-500)' }}> · </span>
            <BlurrableBalance kind="body/accent" color="var(--black)">
              <NeutralDecimals
                parts={formatCurrencyToParts(value, 'en', currency)}
              />
            </BlurrableBalance>
          </>
        )}
      </UIText>
      {allEncrypted ? null : (
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
      )}
    </HStack>
  );
}

export function PositionList({
  apps,
  address,
  moveGasPositionToFront,
  dappChain,
  stickyOffset,
  confidentialPanel = false,
}: {
  apps: AppPortfolio[];
  address: string | null;
  moveGasPositionToFront: boolean;
  dappChain: string | null;
  /**
   * Top offset for the sticky App headings. Defaults to the Overview
   * tab's layout offset; pass `0` when rendering inside a scroll container of
   * its own (e.g. a dialog) so headings stick to that container's top.
   */
  stickyOffset?: number;
  /**
   * Show the Confidential Balances panel above the positions groups when the
   * wallet is Locked (encrypted items in `apps`) and Signable, so it is
   * visible without scrolling. Only the Overview's own list opts in.
   */
  confidentialPanel?: boolean;
}) {
  const COLLAPSED_COUNT = 6;
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

  const preparedPositions = usePreparedPositions({
    apps,
    moveGasPositionToFront,
    dappChain,
  });
  const offsetValuesState = useStore(offsetValues);
  const { currency } = useCurrency();

  const assetPageEnabled = Boolean(
    firebaseConfig?.extension_asset_page_enabled
  );

  const isSignable = useIsSignableWallet(confidentialPanel ? address : null);
  const allItems = useMemo(
    () => preparedPositions.apps.flatMap((app) => app.items),
    [preparedPositions]
  );
  const showConfidentialPanel = Boolean(
    confidentialPanel &&
      address &&
      isSignable &&
      hasEncryptedPositions(allItems)
  );

  return (
    <VStack gap={24}>
      {showConfidentialPanel && address ? (
        <div style={{ paddingInline: 16 }}>
          <ConfidentialBalancesPanel address={address} />
        </div>
      ) : null}
      {preparedPositions.apps.map((preparedApp, appIndex) => {
        const items: Item[] = [];
        const {
          app,
          totalValue,
          relativeValue,
          names,
          nameIndex,
          items: appItems,
        } = preparedApp;
        let appPositionCounter = 0;
        let subHeadingIndex = 0;
        // do not hide if only one item is left
        const stopAt =
          appItems.length - COLLAPSED_COUNT > 1
            ? COLLAPSED_COUNT
            : appItems.length;
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
          for (const position of nameIndex[name]) {
            const showAsLink = !preferences?.testnetMode?.on;
            const itemContent = (
              <GroupedPositionItem
                position={position}
                showGasIcon={
                  preparedPositions.gasAssetId != null &&
                  position.asset.id === preparedPositions.gasAssetId
                }
              />
            );
            items.push({
              key: position.id,
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
                  }-${position.asset.id}${
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
            appPositionCounter++;
            if (appPositionCounter >= stopAt && !expanded.has(app.id)) {
              break outerBlock;
            }
          }
        }
        if (appItems.length > stopAt) {
          items.push({
            key: 'show-more-less',
            onClick: () => {
              if (expanded.has(app.id)) {
                showLess(app.id);
              } else {
                showMore(app.id);
              }
            },
            component: (
              <UIText kind="body/accent" color="var(--primary)">
                {expanded.has(app.id) ? 'Show Less Assets' : 'Show All Assets'}
              </UIText>
            ),
          });
        }

        return (
          <VStack gap={0} key={app.id}>
            {preparedPositions.apps.length > 1 ? (
              <div
                style={{
                  paddingBottom: 4,
                  paddingInline: 16,
                  position: 'sticky',
                  top:
                    stickyOffset ??
                    getStickyOffset(offsetValuesState) +
                      TAB_SELECTOR_HEIGHT +
                      TAB_TOP_PADDING,
                  zIndex: 1,
                  backgroundColor: 'var(--white)',
                }}
              >
                <AppHeading
                  app={app}
                  value={totalValue}
                  relativeValue={relativeValue}
                  currency={currency}
                  allEncrypted={appItems.every(
                    (position) => position.encrypted
                  )}
                />
              </div>
            ) : null}
            {app.url ? (
              <>
                <Spacer height={16} />
                <AppLink app={app} style={{ marginInline: 16 }} />
                <Spacer height={16} />
              </>
            ) : (
              <Spacer height={4} />
            )}
            <SurfaceList
              style={{ position: 'relative', zIndex: 0 }}
              items={items}
            />
            {appIndex !== preparedPositions.apps.length - 1 ? (
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
} & Omit<React.ComponentProps<typeof PositionList>, 'apps'>) {
  const { currency } = useCurrency();
  const chainValue = selectedChain || NetworkSelectValue.All;
  const isAllNetworks = chainValue === NetworkSelectValue.All;
  // The chain filter is server-side: a Grouped Position sums an asset across
  // chains, so a chain-scoped list is a different request, not a client filter
  const { data, isLoading } = useWalletGroupedPositions(
    {
      addresses: [address],
      currency,
      groupBy: ['by-app'],
      chainIds: isAllNetworks ? undefined : [chainValue],
    },
    { source: useHttpClientSource() },
    { refetchInterval: usePositionsRefetchInterval(40000) }
  );

  const apps = useMemo(
    () => filterDisplayableApps(data?.data?.apps ?? []),
    [data]
  );

  if (isLoading) {
    return renderLoadingView() as JSX.Element;
  }
  if (apps.length === 0) {
    return renderEmptyView() as JSX.Element;
  }

  const chainTotalValue = isAllNetworks
    ? portfolioDecomposition?.totalValue
    : portfolioDecomposition?.positionsChainsDistribution[chainValue];

  return (
    <VStack gap={16}>
      <VStack gap={12}>
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
          apps={apps}
          dappChain={dappChain}
          address={address}
          confidentialPanel={true}
          {...positionListProps}
        />
      </VStack>
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
} & Omit<React.ComponentProps<typeof PositionList>, 'apps'>) {
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
  const network = networks?.getNetworkByName(chain);
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
  const apps = useMemo(
    () =>
      addressPositions?.length
        ? addressPositionsToApps(addressPositions, {
            id: chainValue,
            name: network?.name || chainValue,
            iconUrl: network?.iconUrl ?? null,
          })
        : [],
    [addressPositions, chainValue, network]
  );
  if (isError) {
    return renderErrorView(
      networks?.getChainName(chain) || chainValue
    ) as JSX.Element;
  }
  if (isLoading) {
    return renderLoadingView() as JSX.Element;
  }
  if (!apps.length) {
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
                getFullPositionsValue(getAppPositions(apps[0])),
                'en',
                currency
              )}
            />
          }
        />
      </div>
      <PositionList
        address={address}
        apps={apps}
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
  const OVERRIDE_POSITIONS_SUPPORT = addrIsSolana; // todo: remove when backend updates NetworkInfo for Solana
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

  const renderEmptyViewForNetwork = () => (
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

import { useStore } from '@store-unit/react';
import { useMutation, useQuery } from '@tanstack/react-query';
import ArrowDownIcon from 'jsx:src/ui/assets/caret-down-filled.svg';
import RewardsIcon from 'jsx:src/ui/assets/rewards.svg';
import ReadonlyIcon from 'jsx:src/ui/assets/visible.svg';
import React, { useEffect, useMemo, useRef } from 'react';
import { RenderArea } from 'react-area';
import { Route, Routes, useLocation, useSearchParams } from 'react-router-dom';
import { FEATURE_LOYALTY_FLOW } from 'src/env/config';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { updateAddressDnaInfo } from 'src/modules/dna-service/dna.client';
import { createChain } from 'src/modules/networks/Chain';
import {
  useMainnetNetwork,
  useNetworkConfig,
  useNetworks,
} from 'src/modules/networks/useNetworks';
import { useRemoteConfigValue } from 'src/modules/remote-config/useRemoteConfigValue';
import { useHttpClientSource } from 'src/modules/zerion-api/hooks/useHttpClientSource';
import { useWalletPortfolio } from 'src/modules/zerion-api/hooks/useWalletPortfolio';
import { SidepanelOptionsButton } from 'src/shared/sidepanel/SidepanelOptionsButton';
import type { ExternallyOwnedAccount } from 'src/shared/types/ExternallyOwnedAccount';
import { isReadonlyContainer } from 'src/shared/types/validators';
import {
  formatCurrencyToParts,
  formatCurrencyValue,
} from 'src/shared/units/formatCurrencyValue';
import { formatPercent } from 'src/shared/units/formatPercent';
import { useBodyStyle } from 'src/ui/components/Background/Background';
import { CopyButton } from 'src/ui/components/CopyButton';
import { DelayedRender } from 'src/ui/components/DelayedRender/DelayedRender';
import { CenteredFillViewportView } from 'src/ui/components/FillView/FillView';
import noResultsImg from 'url:src/ui/assets/no-results@2x.png';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { PageBottom } from 'src/ui/components/PageBottom';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageFullBleedColumn } from 'src/ui/components/PageFullBleedColumn';
import { ViewLoading } from 'src/ui/components/ViewLoading';
import { WalletDisplayName } from 'src/ui/components/WalletDisplayName';
import { WalletSourceIcon } from 'src/ui/components/WalletSourceIcon';
import { usePreferences } from 'src/ui/features/preferences';
import { XpDropBanner } from 'src/ui/features/xp-drop/components/XpDropBanner';
import { walletPort } from 'src/ui/shared/channels';
import { emitter } from 'src/ui/shared/events';
import { getActiveTabOrigin } from 'src/ui/shared/requests/getActiveTabOrigin';
import { getWalletGroupByAddress } from 'src/ui/shared/requests/getWalletGroupByAddress';
import { requestChainForOrigin } from 'src/ui/shared/requests/requestChainForOrigin';
import { useIsConnectedToActiveTab } from 'src/ui/shared/requests/useIsConnectedToActiveTab';
import { useWalletParams } from 'src/ui/shared/requests/useWalletParams';
import { NBSP } from 'src/ui/shared/typography';
import { useEvent } from 'src/ui/shared/useEvent';
import { useProfileName } from 'src/ui/shared/useProfileName';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { usePendingTransactions } from 'src/ui/transactions/usePendingTransactions';
import { Button } from 'src/ui/ui-kit/Button';
import { HStack } from 'src/ui/ui-kit/HStack';
import { NeutralDecimals } from 'src/ui/ui-kit/NeutralDecimals';
import {
  SegmentedControlGroup,
  SegmentedControlLink,
} from 'src/ui/ui-kit/SegmentedControl';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { TextLink } from 'src/ui/ui-kit/TextLink';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledAnchor } from 'src/ui/ui-kit/UnstyledAnchor';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import { VStack } from 'src/ui/ui-kit/VStack';
import { getAddressType } from 'src/shared/wallet/classifiers';
import { BlurrableBalance } from 'src/ui/components/BlurrableBalance';
import { isMatchForEcosystem } from 'src/shared/wallet/shared';
import { Networks } from 'src/modules/networks/Networks';
import { ViewSuspense } from '../../components/ViewSuspense';
import { WalletAvatar } from '../../components/WalletAvatar';
import { HistoryList } from '../History/History';
import { SettingsLinkIcon } from '../Settings/SettingsLinkIcon';
import { SearchLinkIcon } from '../Search';
import { ActionButtonsRow } from './ActionButtonsRow';
import { BackupReminder } from './BackupReminder';
import { Banners } from './Banners';
import { ConnectionHeader } from './ConnectionHeader';
import { NonFungibleTokens } from './NonFungibleTokens';
import { Positions } from './Positions';
import {
  TABS_OFFSET_METER_ID,
  TAB_SELECTOR_HEIGHT,
  TAB_TOP_PADDING,
  getCurrentTabsOffset,
  getMinTabContentHeight,
  getStickyOffset,
  offsetValues,
} from './getTabsOffset';

function PendingTransactionsIndicator() {
  const pendingTxs = usePendingTransactions();

  if (pendingTxs.length === 0) {
    return null;
  } else {
    return (
      <svg
        viewBox="0 0 16 16"
        style={{ width: 8, height: 8, position: 'relative', top: -4 }}
      >
        <circle cx="8" cy="8" r="8" fill="var(--notice-500)" />
      </svg>
    );
  }
}

/**
 * Product requirement:
 * if we're in default mode (not testnet), but the current dapp chain
 * is a testnet, we want to hide positions and history to supposedly avoid
 * confusion for the user
 */
function TestnetworkGuard({
  dappChain: dappChainStr,
  renderGuard,
  children,
}: React.PropsWithChildren<{
  dappChain: string | null;
  renderGuard: ({
    testnetModeEnabled,
  }: {
    testnetModeEnabled: boolean;
  }) => React.ReactNode;
}>) {
  const { preferences } = usePreferences();
  const dappChain = dappChainStr ? createChain(dappChainStr) : null;
  const { networks, isLoading } = useNetworks(
    dappChainStr ? [dappChainStr] : undefined
  );
  const currentNetwork = dappChain
    ? networks?.getNetworkByName(dappChain)
    : null;
  const { data: mainnetNetwork } = useMainnetNetwork({
    chain: dappChainStr || null,
    enabled:
      Boolean(preferences?.testnetMode?.on) &&
      !isLoading &&
      !currentNetwork &&
      Boolean(dappChainStr),
  });
  const network = currentNetwork || mainnetNetwork;
  const testnetModeEnabled = Boolean(preferences?.testnetMode?.on);
  if (
    dappChainStr &&
    network &&
    testnetModeEnabled !== Boolean(network.is_testnet)
  ) {
    return renderGuard({ testnetModeEnabled });
  }
  return children;
}

function CurrentAccountControls() {
  const { singleAddress, ready } = useAddressParams();
  const { data: wallet } = useQuery({
    queryKey: ['wallet/uiGetCurrentWallet'],
    queryFn: () => walletPort.request('uiGetCurrentWallet'),
  });
  if (!ready || !wallet) {
    return null;
  }
  const addressToCopy = wallet.address || singleAddress;
  return (
    <HStack gap={0} alignItems="center">
      <Button
        kind="text-primary"
        size={40}
        as={UnstyledLink}
        to="/wallet-select"
        title="Select Account"
        className="parent-hover"
        style={{
          paddingInline: '8px 4px',
          ['--button-text-hover' as string]: 'var(--neutral-800)',
          ['--parent-content-color' as string]: 'var(--neutral-500)',
          ['--parent-hovered-content-color' as string]: 'var(--black)',
        }}
      >
        <HStack gap={4} alignItems="center">
          <UIText
            kind="headline/h3"
            style={{
              display: 'grid',
              gridAutoFlow: 'column',
              alignItems: 'center',
            }}
          >
            <WalletDisplayName
              wallet={wallet}
              maxCharacters={16}
              render={(data) => (
                <span
                  style={{
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {data.value}
                </span>
              )}
            />
            <ArrowDownIcon
              className="content-hover"
              style={{ width: 24, height: 24 }}
            />
          </UIText>
        </HStack>
      </Button>
      <CopyButton
        title="Copy Address"
        textToCopy={addressToCopy}
        tooltipContent="Address Copied"
      />

      <RenderArea name="wallet-name-end" />
    </HStack>
  );
}

const ZERION_ORIGIN = 'https://app.zerion.io';

function RewardsLinkIcon({
  currentWallet,
}: {
  currentWallet: ExternallyOwnedAccount;
}) {
  const { pathname } = useLocation();
  const { mutate: acceptZerionOrigin } = useMutation({
    mutationFn: async () => {
      return walletPort.request('acceptOrigin', {
        origin: ZERION_ORIGIN,
        address: currentWallet.address,
      });
    },
  });

  const addWalletParams = useWalletParams(currentWallet);

  return (
    <Button
      kind="ghost"
      as={UnstyledAnchor}
      href={`${ZERION_ORIGIN}/rewards?${addWalletParams}`}
      target="_blank"
      rel="noopener noreferrer"
      size={36}
      title="Rewards"
      style={{ paddingInline: 8 }}
      onClick={() => {
        emitter.emit('buttonClicked', {
          buttonScope: 'Loaylty',
          buttonName: 'Rewards',
          pathname,
        });
        acceptZerionOrigin();
      }}
    >
      <RewardsIcon
        style={{
          width: 20,
          height: 20,
          color: 'linear-gradient(90deg, #a024ef 0%, #fdbb6c 100%)',
        }}
      />
    </Button>
  );
}

function DevelopmentOnly({ children }: React.PropsWithChildren) {
  if (process.env.NODE_ENV === 'development') {
    return children as JSX.Element;
  } else {
    return null;
  }
}

let didRenderOnce = false;
let didRunEffectOnce = false;
function RenderTimeMeasure() {
  // Expected measures:
  // TAB
  // Overview render: ~30ms
  // Overview render effect: ~75ms
  //
  // POPUP
  // Overview render: ~40ms
  // Overview render effect: ~74ms
  //
  if (!didRenderOnce) {
    console.timeEnd('UI render'); // eslint-disable-line no-console
  }

  useEffect(() => {
    if (!didRunEffectOnce) {
      console.timeEnd('UI render effect'); // eslint-disable-line no-console
    }
    didRunEffectOnce = true;
  }, []);
  didRenderOnce = true;
  return null;
}

function ReadonlyMode() {
  return (
    <div
      style={{
        backgroundColor: 'var(--neutral-100)',
        borderRadius: 8,
        padding: '8px 12px',
      }}
    >
      <UIText kind="small/accent" color="var(--neutral-500)">
        <HStack gap={8} justifyContent="space-between">
          <HStack gap={8}>
            <ReadonlyIcon />
            <span>You’re in view-only mode</span>
          </HStack>
          <TextLink
            to="/get-started/existing-select"
            style={{ color: 'var(--primary)' }}
          >
            Import Wallet
          </TextLink>
        </HStack>
      </UIText>
    </div>
  );
}

interface PercentChangeInfo {
  isPositive: boolean;
  isNegative: boolean;
  isNonNegative: boolean;
  isZero: boolean;
  formatted: string;
}

function formatPercentChange(value: number, locale: string): PercentChangeInfo {
  return {
    isPositive: value > 0,
    isNonNegative: value >= 0,
    isNegative: value < 0,
    isZero: value === 0,
    formatted: `${formatPercent(value, locale)}%`,
  };
}

function OverviewComponent() {
  useBodyStyle(
    useMemo(() => ({ ['--background' as string]: 'var(--z-index-0)' }), [])
  );
  const { currency } = useCurrency();
  const location = useLocation();
  const {
    singleAddress: address,
    params,
    ready,
    singleAddressNormalized,
  } = useAddressParams();
  useProfileName({ address, name: null });
  const { data: walletGroup } = useQuery({
    queryKey: ['getWalletGroupByAddress', address],
    queryFn: () => getWalletGroupByAddress(address),
  });
  const isReadonlyGroup =
    walletGroup && isReadonlyContainer(walletGroup.walletContainer);
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedChain = searchParams.get('chain') || null;
  const setSelectedChain = useEvent((value: string | null) => {
    // setSearchParams is not a stable reference: https://github.com/remix-run/react-router/issues/9304
    setSearchParams(value ? [['chain', value]] : '');
  });
  const addressType = address ? getAddressType(address) : null;
  const { data: network } = useNetworkConfig(selectedChain ?? null);

  useEffect(() => {
    if (
      network &&
      !isMatchForEcosystem(address, Networks.getEcosystem(network))
    ) {
      setSelectedChain(null);
    }
  }, [address, network, setSelectedChain]);

  const { data, isLoading: isLoadingPortfolio } = useWalletPortfolio(
    { addresses: [params.address], currency },
    { source: useHttpClientSource() },
    { enabled: ready, refetchInterval: 40000 }
  );
  const walletPortfolio = data?.data;

  const percentageChangeValue = walletPortfolio?.change24h.relative;
  const percentageChange = useMemo(
    () =>
      percentageChangeValue
        ? formatPercentChange(percentageChangeValue, 'en')
        : null,
    [percentageChangeValue]
  );

  const offsetValuesState = useStore(offsetValues);

  const handleTabChange = (to: string) => {
    const isActiveTabClicked = location.pathname === to;
    window.scrollTo({
      behavior: isActiveTabClicked ? 'smooth' : 'instant',
      top: Math.min(window.scrollY, getCurrentTabsOffset(offsetValuesState)),
    });
  };

  const { data: tabData } = useQuery({
    queryKey: ['activeTab/origin'],
    queryFn: getActiveTabOrigin,
    useErrorBoundary: true,
  });
  const activeTabOrigin = tabData?.tabOrigin;
  const { data: siteChain } = useQuery({
    queryKey: ['requestChainForOrigin', activeTabOrigin, address],
    queryFn: async () => {
      if (activeTabOrigin) {
        return requestChainForOrigin(activeTabOrigin, getAddressType(address));
      }
      return null;
    },
    enabled: Boolean(activeTabOrigin),
    useErrorBoundary: true,
    suspense: false,
  });

  const { data: loyaltyEnabled } = useRemoteConfigValue(
    'extension_loyalty_enabled'
  );

  // Update backend record with 'platform: extension'
  useEffect(() => {
    if (singleAddressNormalized) {
      updateAddressDnaInfo(singleAddressNormalized);
    }
  }, [singleAddressNormalized]);

  const { data: isConnected } = useIsConnectedToActiveTab(
    singleAddressNormalized
  );

  const dappChain = isConnected ? siteChain?.toString() : null;

  const tabFallback = (
    <CenteredFillViewportView
      maxHeight={getMinTabContentHeight(offsetValuesState)}
    >
      <DelayedRender delay={2000}>
        <ViewLoading kind="network" />
      </DelayedRender>
    </CenteredFillViewportView>
  );

  const { preferences, setPreferences } = usePreferences();
  const isTestnetMode = Boolean(preferences?.testnetMode?.on);
  const isTestnetModeOnFirstRender = useRef<boolean | null>(isTestnetMode);
  useEffect(() => {
    // reset filter chain when switching between modes
    // so that we do not show unsupported network data
    if (isTestnetModeOnFirstRender.current !== isTestnetMode) {
      isTestnetModeOnFirstRender.current = null; // make it never equal current value
      setSelectedChain(null);
    }
  }, [isTestnetMode, setSelectedChain]);
  const testnetGuardView = (
    <CenteredFillViewportView
      adjustForNavigationBar={true}
      maxHeight={getMinTabContentHeight(offsetValuesState)}
    >
      <VStack gap={16} style={{ textAlign: 'center' }}>
        <img
          src={noResultsImg}
          style={{ height: 64, placeSelf: 'center' }}
          alt=""
        />
        <VStack gap={8}>
          <UIText kind="headline/h3">Wrong Environment</UIText>
          <UIText kind="small/regular" color="var(--neutral-500)">
            <div>
              {preferences?.testnetMode?.on ? (
                <UnstyledButton
                  className="underline hover:no-underline"
                  onClick={() => {
                    setPreferences({ testnetMode: null });
                  }}
                >
                  Turn off Testnet Mode
                </UnstyledButton>
              ) : (
                <UnstyledButton
                  className="underline hover:no-underline"
                  onClick={() => {
                    setPreferences({ testnetMode: { on: true } });
                  }}
                >
                  Turn on Testnet Mode
                </UnstyledButton>
              )}{' '}
              or change your network
            </div>
          </UIText>
        </VStack>
      </VStack>
    </CenteredFillViewportView>
  );

  /**
   * Creates href such that "chain" search-param is preserved between
   * tabs, but clicking on current tab resets searchParams
   */
  const createTo = (to: string, { end = false } = {}) => {
    if (!selectedChain) {
      return to;
    }
    const isActiveRoute = end
      ? location.pathname === to
      : location.pathname.startsWith(to);
    if (isActiveRoute) {
      return to;
    } else {
      return `${to}?chain=${selectedChain}`;
    }
  };

  const { data: currentWallet } = useQuery({
    queryKey: ['wallet/uiGetCurrentWallet'],
    queryFn: () => {
      return walletPort.request('uiGetCurrentWallet');
    },
  });

  return (
    <PageColumn
      style={{
        ['--column-padding-inline' as string]: '8px',
        ['--background' as string]: 'var(--neutral-100)',
      }}
    >
      <PageFullBleedColumn
        paddingInline={true}
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 'var(--navbar-index)',
          paddingInline: 0,
        }}
      >
        <ConnectionHeader />
        <BackupReminder />
        <div style={{ backgroundColor: 'var(--white)' }}>
          <Spacer height={16} />
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingInline: '8px 16px',
              height: 24,
            }}
          >
            <CurrentAccountControls />
            <HStack gap={0} alignItems="center">
              {FEATURE_LOYALTY_FLOW === 'on' &&
              loyaltyEnabled &&
              currentWallet &&
              addressType === 'evm' ? (
                <RewardsLinkIcon currentWallet={currentWallet} />
              ) : null}
              <SearchLinkIcon />
              <SettingsLinkIcon />
              <SidepanelOptionsButton />
            </HStack>
          </div>
          <Spacer height={16} />
        </div>
      </PageFullBleedColumn>
      <div
        style={{
          height: isLoadingPortfolio ? 68 : undefined,
          paddingInline: 8,
        }}
      >
        <HStack gap={12} alignItems="center">
          {!isLoadingPortfolio ? (
            <WalletAvatar
              address={address}
              size={64}
              borderRadius={12}
              icon={
                <WalletSourceIcon
                  address={address}
                  groupId={null}
                  style={{ width: 24, height: 24 }}
                  borderRadius={8}
                  cutoutStroke={3}
                />
              }
            />
          ) : null}
          <VStack gap={0}>
            <BlurrableBalance kind="headline/h1" color="var(--black)">
              <UIText kind="headline/h1">
                {walletPortfolio?.totalValue != null ? (
                  <NeutralDecimals
                    parts={formatCurrencyToParts(
                      walletPortfolio.totalValue,
                      'en',
                      currency
                    )}
                  />
                ) : (
                  NBSP
                )}
              </UIText>
            </BlurrableBalance>
            {percentageChange ? (
              <UIText
                kind="small/regular"
                color={
                  percentageChange.isNonNegative
                    ? 'var(--positive-500)'
                    : 'var(--negative-500)'
                }
                style={{ display: 'flex', gap: 4 }}
              >
                <span>
                  {`${percentageChange.isPositive ? '+' : ''}${
                    percentageChange.formatted
                  }`}
                </span>
                <BlurrableBalance
                  kind="small/regular"
                  color={
                    percentageChange.isNonNegative
                      ? 'var(--positive-500)'
                      : 'var(--negative-500)'
                  }
                >
                  {walletPortfolio?.change24h.absolute
                    ? `(${formatCurrencyValue(
                        Math.abs(walletPortfolio.change24h.absolute),
                        'en',
                        currency
                      )})`
                    : ''}
                </BlurrableBalance>{' '}
                Today
              </UIText>
            ) : (
              <UIText kind="small/regular">{NBSP}</UIText>
            )}
          </VStack>
        </HStack>
      </div>
      <Spacer height={16} />
      <div style={{ paddingInline: 'var(--column-padding-inline)' }}>
        {isReadonlyGroup ? <ReadonlyMode /> : <ActionButtonsRow />}
      </div>
      <DevelopmentOnly>
        <RenderTimeMeasure />
      </DevelopmentOnly>
      <Spacer height={isReadonlyGroup ? 16 : 24} />
      <Banners address={singleAddressNormalized} />
      <div id={TABS_OFFSET_METER_ID} />
      <PageFullBleedColumn
        paddingInline={false}
        style={{
          position: 'sticky',
          top: getStickyOffset(offsetValuesState),
          zIndex: 'var(--max-layout-index)',
          backgroundColor: 'var(--background)',
        }}
      >
        <div
          style={{
            backgroundColor: 'var(--white)',
            height: TAB_SELECTOR_HEIGHT,
          }}
        >
          <SegmentedControlGroup
            style={{
              paddingInline: 16,
              gap: 24,
              borderBottom: 'none',
            }}
            childrenLayout="start"
          >
            <div
              style={{
                height: 2,
                backgroundColor: 'var(--neutral-200)',
                position: 'absolute',
                bottom: -1,
                left: 16,
                right: 16,
                zIndex: 0,
              }}
            />
            <SegmentedControlLink
              to={createTo('/overview', { end: true })}
              end={true}
              onClick={() => handleTabChange('/overview')}
            >
              Tokens
            </SegmentedControlLink>
            <SegmentedControlLink
              to={createTo('/overview/nfts')}
              onClick={() => handleTabChange('/overview/nfts')}
            >
              NFTs
            </SegmentedControlLink>
            <SegmentedControlLink
              to={createTo('/overview/history')}
              onClick={() => handleTabChange('/overview/history')}
            >
              History <PendingTransactionsIndicator />
            </SegmentedControlLink>
          </SegmentedControlGroup>
        </div>
      </PageFullBleedColumn>
      <PageFullBleedColumn
        paddingInline={false}
        style={{
          position: 'relative',
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--white)',
          ['--surface-background-color' as string]: 'var(--white)',
        }}
      >
        <div style={{ minHeight: getMinTabContentHeight(offsetValuesState) }}>
          <Routes>
            <Route
              path="/"
              element={
                <ViewSuspense logDelays={true} fallback={tabFallback}>
                  <NavigationTitle title={null} documentTitle="Overview" />
                  <div
                    style={{
                      height: TAB_TOP_PADDING,
                      position: 'sticky',
                      top:
                        getStickyOffset(offsetValuesState) +
                        TAB_SELECTOR_HEIGHT,
                      zIndex: 1,
                      backgroundColor: 'var(--white)',
                    }}
                  />
                  <TestnetworkGuard
                    dappChain={dappChain || null}
                    renderGuard={() => testnetGuardView}
                  >
                    <VStack gap={20}>
                      {!isReadonlyGroup && loyaltyEnabled ? (
                        <XpDropBanner address={params.address} />
                      ) : null}
                      <Positions
                        dappChain={dappChain || null}
                        selectedChain={selectedChain}
                        onChainChange={setSelectedChain}
                      />
                    </VStack>
                  </TestnetworkGuard>
                </ViewSuspense>
              }
            />
            <Route
              path="/nfts"
              element={
                <ViewSuspense logDelays={true} fallback={tabFallback}>
                  <NavigationTitle title={null} documentTitle="NFTs" />
                  <Spacer height={TAB_TOP_PADDING} />
                  <TestnetworkGuard
                    dappChain={dappChain || null}
                    renderGuard={() => testnetGuardView}
                  >
                    <NonFungibleTokens
                      dappChain={dappChain || null}
                      selectedChain={selectedChain}
                      onChainChange={setSelectedChain}
                    />
                  </TestnetworkGuard>
                </ViewSuspense>
              }
            />
            <Route
              path="/history"
              element={
                <ViewSuspense logDelays={true} fallback={tabFallback}>
                  <NavigationTitle title={null} documentTitle="History" />
                  <Spacer height={TAB_TOP_PADDING} />
                  <TestnetworkGuard
                    dappChain={dappChain || null}
                    renderGuard={() => testnetGuardView}
                  >
                    <HistoryList
                      dappChain={dappChain || null}
                      selectedChain={selectedChain}
                      onChainChange={setSelectedChain}
                    />
                  </TestnetworkGuard>
                </ViewSuspense>
              }
            />
          </Routes>
          <PageBottom />
        </div>
      </PageFullBleedColumn>
    </PageColumn>
  );
}

export function Overview() {
  return <OverviewComponent />;
}

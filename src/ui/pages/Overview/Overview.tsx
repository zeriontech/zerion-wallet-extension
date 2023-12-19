import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { useAddressPortfolio } from 'defi-sdk';
import { RenderArea } from 'react-area';
import { UIText } from 'src/ui/ui-kit/UIText';
import { PageColumn } from 'src/ui/components/PageColumn';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import {
  formatCurrencyToParts,
  formatCurrencyValue,
} from 'src/shared/units/formatCurrencyValue';
import { formatPercent } from 'src/shared/units/formatPercent/formatPercent';
import ArrowDownIcon from 'jsx:src/ui/assets/caret-down-filled.svg';
import { HStack } from 'src/ui/ui-kit/HStack';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { usePendingTransactions } from 'src/ui/transactions/usePendingTransactions';
import { NeutralDecimals } from 'src/ui/ui-kit/NeutralDecimals';
import { Button } from 'src/ui/ui-kit/Button';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import {
  SegmentedControlGroup,
  SegmentedControlLink,
} from 'src/ui/ui-kit/SegmentedControl';
import { PageBottom } from 'src/ui/components/PageBottom';
import { useQuery } from '@tanstack/react-query';
import { walletPort } from 'src/ui/shared/channels';
import { NBSP } from 'src/ui/shared/typography';
import { WalletDisplayName } from 'src/ui/components/WalletDisplayName';
import { PageFullBleedColumn } from 'src/ui/components/PageFullBleedColumn';
import { CopyButton } from 'src/ui/components/CopyButton';
import { ViewLoading } from 'src/ui/components/ViewLoading';
import { VStack } from 'src/ui/ui-kit/VStack';
import {
  DelayedRender,
  useRenderDelay,
} from 'src/ui/components/DelayedRender/DelayedRender';
import { useBodyStyle } from 'src/ui/components/Background/Background';
import { useProfileName } from 'src/ui/shared/useProfileName';
import { CenteredFillViewportView } from 'src/ui/components/FillView/FillView';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { getActiveTabOrigin } from 'src/ui/shared/requests/getActiveTabOrigin';
import { useIsConnectedToActiveTab } from 'src/ui/shared/requests/useIsConnectedToActiveTab';
import { requestChainForOrigin } from 'src/ui/shared/requests/requestChainForOrigin';
import { OverviewDnaBanners } from 'src/ui/DNA/components/DnaBanners';
import { updateAddressDnaInfo } from 'src/modules/dna-service/dna.client';
import { WalletSourceIcon } from 'src/ui/components/WalletSourceIcon';
import { HistoryList } from '../History/History';
import { SettingsLinkIcon } from '../Settings/SettingsLinkIcon';
import { WalletAvatar } from '../../components/WalletAvatar';
import { Feed } from '../Feed';
import { ViewSuspense } from '../../components/ViewSuspense';
import { NonFungibleTokens } from './NonFungibleTokens';
import { Positions } from './Positions';
import { ActionButtonsRow } from './ActionButtonsRow';
import {
  MIN_TAB_CONTENT_HEIGHT,
  TAB_SELECTOR_HEIGHT,
  TAB_STICKY_OFFSET,
  TABS_OFFSET_METER_ID,
  TAB_TOP_PADDING,
  getTabsOffset,
} from './getTabsOffset';
import { ConnectionHeader } from './ConnectionHeader';

interface ChangeInfo {
  isPositive: boolean;
  isNegative: boolean;
  isNonNegative: boolean;
  isZero: boolean;
  formatted: string;
}

function formatPercentChange(value: number, locale: string): ChangeInfo {
  return {
    isPositive: value > 0,
    isNonNegative: value >= 0,
    isNegative: value < 0,
    isZero: value === 0,
    formatted: `${formatPercent(value, locale)}%`,
  };
}

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

function PercentChange({
  value,
  locale,
  render,
}: {
  value?: number;
  locale: string;
  render: (changeInfo: ChangeInfo) => JSX.Element;
}): JSX.Element | null {
  if (value == null) {
    return null;
  }
  return render(formatPercentChange(value, locale));
}

function CurrentAccountControls() {
  const { singleAddress, ready } = useAddressParams();
  const { data: wallet } = useQuery({
    queryKey: ['wallet/uiGetCurrentWallet'],
    queryFn: () => walletPort.request('uiGetCurrentWallet'),
  });
  const visible = useRenderDelay(16);
  if (!ready || !wallet) {
    return null;
  }
  const addressToCopy = wallet.address || singleAddress;
  return (
    <HStack
      gap={0}
      alignItems="center"
      style={{ visibility: visible ? 'visible' : 'hidden' }}
    >
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
            style={{ display: 'inline-flex', alignItems: 'center' }}
          >
            <WalletDisplayName wallet={wallet} maxCharacters={16} />
            <ArrowDownIcon
              className="content-hover"
              style={{ width: 24, height: 24 }}
            />
          </UIText>
        </HStack>
      </Button>
      <CopyButton address={addressToCopy} />

      <RenderArea name="wallet-name-end" />
    </HStack>
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

function OverviewComponent() {
  useBodyStyle(
    useMemo(() => ({ ['--background' as string]: 'var(--z-index-0)' }), [])
  );
  const location = useLocation();
  const { singleAddress, params, ready, singleAddressNormalized } =
    useAddressParams();
  useProfileName({ address: singleAddress, name: null });
  const [filterChain, setFilterChain] = useState<string | null>(null);
  const { value, isLoading: isLoadingPortfolio } = useAddressPortfolio(
    {
      ...params,
      currency: 'usd',
      portfolio_fields: 'all',
      use_portfolio_service: true,
    },
    { enabled: ready }
  );

  const handleTabChange = useCallback(
    (to: string) => {
      const isActiveTabClicked = location.pathname === to;
      window.scrollTo({
        behavior: isActiveTabClicked ? 'smooth' : 'instant',
        top: Math.min(window.scrollY, getTabsOffset()),
      });
    },
    [location]
  );

  const { data: tabData } = useQuery({
    queryKey: ['activeTab/origin'],
    queryFn: getActiveTabOrigin,
    useErrorBoundary: true,
  });
  const activeTabOrigin = tabData?.tabOrigin;
  const { data: siteChain } = useQuery({
    queryKey: ['requestChainForOrigin', activeTabOrigin],
    queryFn: () => requestChainForOrigin(activeTabOrigin),
    enabled: Boolean(activeTabOrigin),
    useErrorBoundary: true,
    suspense: false,
  });

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
    <CenteredFillViewportView maxHeight={MIN_TAB_CONTENT_HEIGHT}>
      <DelayedRender delay={2000}>
        <ViewLoading kind="network" />
      </DelayedRender>
    </CenteredFillViewportView>
  );

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
        <div
          style={{ backgroundColor: 'var(--background)', paddingInline: 16 }}
        >
          <Spacer height={16} />
          <ConnectionHeader />
          <Spacer height={16} />
        </div>
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
            <SettingsLinkIcon />
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
              address={singleAddress}
              size={64}
              borderRadius={12}
              icon={
                <WalletSourceIcon
                  address={singleAddress}
                  style={{ width: 24, height: 24 }}
                />
              }
            />
          ) : null}
          <VStack gap={0}>
            <UIText kind="headline/h1">
              {value?.total_value != null ? (
                <NeutralDecimals
                  parts={formatCurrencyToParts(value.total_value, 'en', 'usd')}
                />
              ) : (
                NBSP
              )}
            </UIText>
            {value?.relative_change_24h ? (
              <PercentChange
                value={value.relative_change_24h}
                locale="en"
                render={(change) => {
                  const sign = change.isPositive ? '+' : '';
                  return (
                    <UIText
                      kind="small/regular"
                      color={
                        change.isNonNegative
                          ? 'var(--positive-500)'
                          : 'var(--negative-500)'
                      }
                    >
                      {`${sign}${change.formatted}`}{' '}
                      {value?.absolute_change_24h
                        ? `(${formatCurrencyValue(
                            Math.abs(value.absolute_change_24h),
                            'en',
                            'usd'
                          )})`
                        : ''}{' '}
                      Today
                    </UIText>
                  );
                }}
              />
            ) : (
              <UIText kind="small/regular">{NBSP}</UIText>
            )}
          </VStack>
        </HStack>
      </div>
      <Spacer height={16} />
      <div style={{ paddingInline: 'var(--column-padding-inline)' }}>
        <ActionButtonsRow />
      </div>
      <DevelopmentOnly>
        <RenderTimeMeasure />
      </DevelopmentOnly>
      <Spacer height={24} />
      <div style={{ paddingInline: 'var(--column-padding-inline)' }}>
        <OverviewDnaBanners address={singleAddressNormalized} />
      </div>
      <div id={TABS_OFFSET_METER_ID} />
      <PageFullBleedColumn
        paddingInline={false}
        style={{
          position: 'sticky',
          top: TAB_STICKY_OFFSET,
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
              to="/overview"
              end={true}
              onClick={() => handleTabChange('/overview')}
            >
              Tokens
            </SegmentedControlLink>
            <SegmentedControlLink
              to="/overview/nfts"
              onClick={() => handleTabChange('/overview/nfts')}
            >
              NFTs
            </SegmentedControlLink>
            <SegmentedControlLink
              to="/overview/history"
              onClick={() => handleTabChange('/overview/history')}
            >
              History <PendingTransactionsIndicator />
            </SegmentedControlLink>
            <SegmentedControlLink
              to="/overview/feed"
              onClick={() => handleTabChange('/overview/feed')}
            >
              Perks
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
        <div style={{ minHeight: MIN_TAB_CONTENT_HEIGHT }}>
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
                      top: TAB_STICKY_OFFSET + TAB_SELECTOR_HEIGHT,
                      zIndex: 1,
                      backgroundColor: 'var(--white)',
                    }}
                  />
                  <Positions
                    dappChain={dappChain || null}
                    filterChain={filterChain}
                    onChainChange={setFilterChain}
                  />
                </ViewSuspense>
              }
            />
            <Route
              path="/nfts"
              element={
                <ViewSuspense logDelays={true} fallback={tabFallback}>
                  <NavigationTitle title={null} documentTitle="NFTs" />
                  <Spacer height={TAB_TOP_PADDING} />
                  <NonFungibleTokens
                    dappChain={dappChain || null}
                    filterChain={filterChain}
                    onChainChange={setFilterChain}
                  />
                </ViewSuspense>
              }
            />
            <Route
              path="/history"
              element={
                <ViewSuspense logDelays={true} fallback={tabFallback}>
                  <NavigationTitle title={null} documentTitle="History" />
                  <Spacer height={TAB_TOP_PADDING} />
                  <HistoryList />
                </ViewSuspense>
              }
            />
            <Route
              path="/feed"
              element={
                <ViewSuspense logDelays={true} fallback={tabFallback}>
                  <NavigationTitle title={null} documentTitle="Perks" />
                  <Spacer height={TAB_TOP_PADDING} />
                  <Feed />
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

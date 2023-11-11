import React, { useCallback, useEffect, useMemo } from 'react';
import { Route, Routes } from 'react-router-dom';
import { useAddressPortfolio } from 'defi-sdk';
import { UIText } from 'src/ui/ui-kit/UIText';
import { PageColumn } from 'src/ui/components/PageColumn';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import {
  formatCurrencyToParts,
  formatCurrencyValue,
} from 'src/shared/units/formatCurrencyValue';
import { formatPercent } from 'src/shared/units/formatPercent/formatPercent';
import ArrowDownIcon from 'jsx:src/ui/assets/caret-down-filled.svg';
import PersonIcon from 'jsx:src/ui/assets/person.svg';
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
import { usePreferences } from 'src/ui/features/preferences';
import { useBodyStyle } from 'src/ui/components/Background/Background';
import { useProfileName } from 'src/ui/shared/useProfileName';
import {
  PausedBanner,
  PauseInjectionControl,
} from 'src/ui/components/PauseInjection';
import { InvitationBanner } from 'src/ui/components/InvitationFlow';
import type { ExternallyOwnedAccount } from 'src/shared/types/ExternallyOwnedAccount';
import { CenteredFillViewportView } from 'src/ui/components/FillView/FillView';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { HistoryList } from '../History/History';
import { SettingsLinkIcon } from '../Settings/SettingsLinkIcon';
import { WalletAvatar } from '../../components/WalletAvatar';
import { Feed } from '../Feed';
import { ViewSuspense } from '../../components/ViewSuspense';
import { CurrentNetwork } from './CurrentNetwork';
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

function CurrentAccount({ wallet }: { wallet: ExternallyOwnedAccount }) {
  return (
    <span style={{ fontWeight: 'normal' }}>
      <WalletDisplayName wallet={wallet} maxCharacters={16} />
    </span>
  );
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
        kind="ghost"
        size={40}
        as={UnstyledLink}
        to="/wallet-select"
        title="Select Account"
        style={{ paddingInline: 8 }}
      >
        <HStack gap={4} alignItems="center">
          <PersonIcon />
          <UIText
            kind="body/accent"
            style={{ display: 'inline-flex', alignItems: 'center' }}
          >
            <CurrentAccount wallet={wallet} />
            <ArrowDownIcon />
          </UIText>
        </HStack>
      </Button>
      <CopyButton address={addressToCopy} />
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
  const { singleAddress, singleAddressNormalized, params, ready } =
    useAddressParams();
  useProfileName({ address: singleAddress, name: null });
  const { preferences, setPreferences } = usePreferences();
  const setChain = (overviewChain: string) => setPreferences({ overviewChain });
  const { value, isLoading: isLoadingPortfolio } = useAddressPortfolio(
    {
      ...params,
      currency: 'usd',
      portfolio_fields: 'all',
      use_portfolio_service: true,
    },
    { enabled: ready }
  );

  const handleTabChange = useCallback(() => {
    window.scrollTo({
      behavior: 'instant',
      top: Math.min(window.scrollY, getTabsOffset()),
    });
  }, []);

  if (!preferences) {
    return <ViewLoading />;
  }

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
        backgroundColor: 'var(--background)',
      }}
    >
      <PageFullBleedColumn
        paddingInline={true}
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 'var(--navbar-index)',
          // ['--background' as string]: 'var(--neutral-100)',
          backgroundColor: 'var(--background)',
        }}
      >
        <Spacer height={16} />
        <HStack gap={12} justifyContent="space-between" alignItems="center">
          <CurrentAccountControls />

          <HStack gap={0} alignItems="center">
            {preferences?.showNetworkSwitchShortcut === true ? (
              <CurrentNetwork address={singleAddressNormalized} />
            ) : null}
            <PauseInjectionControl />
            <SettingsLinkIcon />
          </HStack>
        </HStack>
        <Spacer height={16} />
      </PageFullBleedColumn>
      <PausedBanner style={{ marginBottom: 16, marginInline: 8 }} />
      <div
        style={{
          height: isLoadingPortfolio ? 68 : undefined,
          paddingInline: 8,
        }}
      >
        <HStack gap={16} alignItems="center">
          {!isLoadingPortfolio ? (
            <WalletAvatar address={singleAddress} size={64} borderRadius={6} />
          ) : null}
          <VStack gap={0}>
            <UIText kind="headline/hero">
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
                            value?.absolute_change_24h,
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
              <UIText kind="body/regular">{NBSP}</UIText>
            )}
          </VStack>
        </HStack>
      </div>
      <Spacer height={20} />
      <div style={{ paddingInline: 'var(--column-padding-inline)' }}>
        <ActionButtonsRow />
      </div>
      <DevelopmentOnly>
        <RenderTimeMeasure />
      </DevelopmentOnly>
      <Spacer height={20} />
      <InvitationBanner
        address={singleAddressNormalized}
        style={{ marginInline: 8 }}
      />
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
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            backgroundColor: 'var(--white)',
            paddingTop: 16,
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
            <SegmentedControlLink
              to="/overview"
              end={true}
              onClick={handleTabChange}
            >
              Tokens
            </SegmentedControlLink>
            <SegmentedControlLink to="/overview/nfts" onClick={handleTabChange}>
              NFTs
            </SegmentedControlLink>
            <SegmentedControlLink
              to="/overview/history"
              onClick={handleTabChange}
            >
              History <PendingTransactionsIndicator />
            </SegmentedControlLink>
            <SegmentedControlLink to="/overview/feed" onClick={handleTabChange}>
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
          <Spacer height={TAB_TOP_PADDING} />
          <Routes>
            <Route
              path="/"
              element={
                <ViewSuspense logDelays={true} fallback={tabFallback}>
                  <NavigationTitle title={null} documentTitle="Overview" />
                  <Positions
                    chain={preferences.overviewChain}
                    onChainChange={setChain}
                  />
                </ViewSuspense>
              }
            />
            <Route
              path="/nfts"
              element={
                <ViewSuspense logDelays={true} fallback={tabFallback}>
                  <NavigationTitle title={null} documentTitle="NFTs" />
                  <NonFungibleTokens
                    chain={preferences.overviewChain}
                    onChainChange={setChain}
                  />
                </ViewSuspense>
              }
            />
            <Route
              path="/history"
              element={
                <ViewSuspense logDelays={true} fallback={tabFallback}>
                  <NavigationTitle title={null} documentTitle="History" />
                  <HistoryList
                    chain={preferences.overviewChain}
                    onChainChange={setChain}
                  />
                </ViewSuspense>
              }
            />
            <Route
              path="/feed"
              element={
                <ViewSuspense logDelays={true} fallback={tabFallback}>
                  <NavigationTitle title={null} documentTitle="Perks" />
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

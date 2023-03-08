import React from 'react';
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
// import { Twinkle } from 'src/ui/ui-kit/Twinkle';
// import ZerionSquircle from 'jsx:src/ui/assets/zerion-squircle.svg';
// import { FillView } from 'src/ui/components/FillView';
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
import { useQuery } from 'react-query';
import { walletPort } from 'src/ui/shared/channels';
import { NBSP } from 'src/ui/shared/typography';
import { WalletDisplayName } from 'src/ui/components/WalletDisplayName';
import type { BareWallet } from 'src/shared/types/BareWallet';
import { PageFullBleedColumn } from 'src/ui/components/PageFullBleedColumn';
import { CopyButton } from 'src/ui/components/CopyButton';
import { VStack } from 'src/ui/ui-kit/VStack';
import { DelayedRender } from 'src/ui/components/DelayedRender';
import { HistoryList } from '../History/History';
import { SettingsLinkIcon } from '../Settings/SettingsLinkIcon';
import { WalletAvatar } from '../../components/WalletAvatar';
import { Feed } from '../Feed';
import { ViewSuspense } from '../../components/ViewSuspense';
import { CurrentNetwork } from './CurrentNetwork';
import { NonFungibleTokens } from './NonFungibleTokens';
import { Positions } from './Positions';
import { ActionButtonsRow } from './ActionButtonsRow';

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

function CurrentAccount({ wallet }: { wallet: BareWallet }) {
  return (
    <span style={{ fontWeight: 'normal' }}>
      <WalletDisplayName wallet={wallet} maxCharacters={16} />
    </span>
  );
}

function CurrentAccountControls() {
  const { singleAddress, ready } = useAddressParams();
  const { data: wallet } = useQuery('wallet/uiGetCurrentWallet', () =>
    walletPort.request('uiGetCurrentWallet')
  );
  if (!ready || !wallet) {
    return null;
  }
  const addressToCopy = wallet.address || singleAddress;
  return (
    <HStack gap={0} alignItems="center">
      <Button
        kind="ghost"
        size={32}
        as={UnstyledLink}
        to="/wallet-select"
        title="Select Account"
      >
        <CurrentAccount wallet={wallet} />
        <ArrowDownIcon />
      </Button>
      <CopyButton address={addressToCopy} />
    </HStack>
  );
}

function OverviewComponent() {
  const { singleAddress, params, ready } = useAddressParams();
  const { value, isLoading: isLoadingPortfolio } = useAddressPortfolio(
    {
      ...params,
      currency: 'usd',
      portfolio_fields: 'all',
      use_portfolio_service: true,
    },
    { enabled: ready }
  );
  const { data: preferences } = useQuery(
    'wallet/getPreferences',
    () => walletPort.request('getPreferences'),
    { useErrorBoundary: true, suspense: true }
  );
  // if (!value) {
  //   return (
  //     <FillView>
  //       <Twinkle>
  //         <ZerionSquircle style={{ width: 64, height: 64 }} />
  //       </Twinkle>
  //       <Spacer height={12} />
  //       <UIText kind="caption/regular">
  //         (address portfolio might take long...)
  //       </UIText>
  //     </FillView>
  //   );
  // }
  return (
    <PageColumn>
      <PageFullBleedColumn
        padding={true}
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 'var(--navbar-index)',
          backgroundColor: 'var(--white)',
        }}
      >
        <Spacer height={8} />
        <HStack gap={12} justifyContent="space-between" alignItems="center">
          <CurrentAccountControls />

          <HStack gap={0} alignItems="center">
            {preferences?.showNetworkSwitchShortcut === true ? (
              <CurrentNetwork address={singleAddress} />
            ) : null}
            <SettingsLinkIcon />
          </HStack>
        </HStack>
      </PageFullBleedColumn>
      <PageFullBleedColumn
        padding={true}
        style={{ backgroundColor: 'var(--white)' }}
      >
        <Spacer height={24} />
        <div style={{ height: isLoadingPortfolio ? 68 : undefined }}>
          <HStack gap={16} alignItems="center">
            {!isLoadingPortfolio ? (
              <WalletAvatar
                address={singleAddress}
                size={64}
                borderRadius={6}
              />
            ) : null}
            <VStack gap={0}>
              <UIText kind="headline/hero">
                {value?.total_value != null ? (
                  <NeutralDecimals
                    parts={formatCurrencyToParts(
                      value.total_value,
                      'en',
                      'usd'
                    )}
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
                        kind="body/regular"
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
        <ActionButtonsRow />
        <Spacer height={20} />
      </PageFullBleedColumn>
      <PageFullBleedColumn
        padding={false}
        style={{
          position: 'sticky',
          top: 40,
          zIndex: 'var(--max-layout-index)',
          backgroundColor: 'var(--white)',
        }}
      >
        <SegmentedControlGroup style={{ paddingTop: 4 }}>
          <SegmentedControlLink to="/overview" end={true}>
            Tokens
          </SegmentedControlLink>
          <SegmentedControlLink to="/overview/nfts">NFTs</SegmentedControlLink>
          <SegmentedControlLink to="/overview/history">
            History <PendingTransactionsIndicator />
          </SegmentedControlLink>
          <SegmentedControlLink
            to="/overview/feed"
            onClick={() => {
              walletPort.request('daylightAction', {
                event_name: 'Perks: Card Opened',
                address: singleAddress,
              });
            }}
          >
            Perks
          </SegmentedControlLink>
        </SegmentedControlGroup>
      </PageFullBleedColumn>
      <Spacer height={24} />
      <Routes>
        <Route
          path="/"
          element={
            <DelayedRender
              /** Cheap perceived performance hack: render expensive Positions component later so that initial UI render is faster */
              delay={16}
            >
              <Positions />
            </DelayedRender>
          }
        />
        <Route path="/nfts" element={<NonFungibleTokens />} />
        <Route
          path="/history"
          element={
            <ViewSuspense>
              <HistoryList />
            </ViewSuspense>
          }
        />
        <Route path="/feed" element={<Feed />} />
      </Routes>
      <PageBottom />
    </PageColumn>
  );
}

export function Overview() {
  return <OverviewComponent />;
}

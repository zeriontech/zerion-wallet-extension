import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { useAddressPortfolio } from 'defi-sdk';
import { UIText } from 'src/ui/ui-kit/UIText';
import { PageColumn } from 'src/ui/components/PageColumn';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { Surface } from 'src/ui/ui-kit/Surface';
import { truncateAddress } from 'src/ui/shared/truncateAddress';
import { BlockieImg } from 'src/ui/components/BlockieImg';
import { Background } from 'src/ui/components/Background';
import {
  formatCurrencyToParts,
  formatCurrencyValue,
} from 'src/shared/units/formatCurrencyValue';
import { formatPercent } from 'src/shared/units/formatPercent/formatPercent';
// import { Twinkle } from 'src/ui/ui-kit/Twinkle';
// import ZerionSquircle from 'src/ui/assets/zerion-squircle.svg';
// import { FillView } from 'src/ui/components/FillView';
import AddWalletIcon from 'src/ui/assets/add-wallet.svg';
import { HStack } from 'src/ui/ui-kit/HStack';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { usePendingTransactions } from 'src/ui/transactions/usePendingTransactions';
import { NeutralDecimals } from 'src/ui/ui-kit/NeutralDecimals';
import { SettingsLinkIcon } from '../Settings/SettingsLinkIcon';
import { Media } from 'src/ui/ui-kit/Media';
import { Button } from 'src/ui/ui-kit/Button';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import {
  SegmentedControlGroup,
  SegmentedControlLink,
} from 'src/ui/ui-kit/SegmentedControl';
import { Positions } from './Positions';

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

function CurrentAccount() {
  const { singleAddress, ready } = useAddressParams();
  if (!ready) {
    return null;
  }
  return (
    <Media
      image={<BlockieImg address={singleAddress} size={24} />}
      text={
        <span style={{ fontWeight: 'normal' }}>
          {truncateAddress(singleAddress, 4)}
        </span>
      }
      detailText={null}
    />
  );
}

export function Overview() {
  const { params, ready } = useAddressParams();
  const { value } = useAddressPortfolio(
    {
      ...params,
      currency: 'usd',
      portfolio_fields: 'all',
      use_portfolio_service: true,
    },
    { enabled: ready }
  );
  // if (!value) {
  //   return (
  //     <FillView>
  //       <Twinkle>
  //         <ZerionSquircle style={{ width: 64, height: 64 }} />
  //       </Twinkle>
  //       <Spacer height={12} />
  //       <UIText kind="caption/reg">
  //         (address portfolio might take long...)
  //       </UIText>
  //     </FillView>
  //   );
  // }
  return (
    <Background backgroundColor="var(--background)">
      <PageColumn>
        <div
          style={{
            position: 'sticky',
            top: 0,
            backgroundColor: 'var(--background)',
          }}
        >
          <Spacer height={8} />
          <HStack gap={12} justifyContent="space-between" alignItems="center">
            <Button
              kind="ghost"
              size={32}
              as={UnstyledLink}
              to="/wallet-select"
              title="Select Account"
            >
              <CurrentAccount />
            </Button>

            <HStack gap={4}>
              <SettingsLinkIcon />
              <Button
                kind="ghost"
                size={32}
                title="Add Wallet"
                as={UnstyledLink}
                to="/get-started"
              >
                <AddWalletIcon />
              </Button>
            </HStack>
          </HStack>
        </div>
        <Spacer height={24} />
        {/*
        <PageHeading>Summary</PageHeading>
        <Spacer height={24} />
        */}
        <Surface style={{ padding: 12 }}>
          <UIText kind="subtitle/l_reg">Portfolio</UIText>
          <UIText kind="h/1_med">
            {value?.total_value ? (
              <NeutralDecimals
                parts={formatCurrencyToParts(value.total_value, 'en', 'usd')}
              />
            ) : null}
          </UIText>
          {value?.relative_change_24h ? (
            <PercentChange
              value={value.relative_change_24h}
              locale="en"
              render={(change) => {
                const sign = change.isPositive ? '+' : '';
                return (
                  <UIText
                    kind="subtitle/l_reg"
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
          ) : null}
        </Surface>
        {/*
        <Spacer height={8} />
        <Surface style={{ padding: 12 }}>
          <HStack gap={12}>
            <BlockieImg address={singleAddress} size={44} />
            <div>
              <UIText kind="subtitle/l_reg" title={singleAddress}>
                <AddressText address={singleAddress} />
              </UIText>
              <HStack gap={8} alignItems="baseline">
                <UIText kind="h/6_med">
                  <NeutralDecimals
                    parts={formatCurrencyToParts(
                      value?.total_value ?? 0,
                      'en',
                      'usd'
                    )}
                  />{' '}
                  {value?.relative_change_24h ? (
                    <PercentChange
                      value={value.relative_change_24h}
                      locale="en"
                      render={(change) => {
                        const sign = change.isPositive ? '+' : '';
                        return (
                          <UIText
                            inline={true}
                            kind="subtitle/l_reg"
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
                  ) : null}
                </UIText>
              </HStack>
            </div>
          </HStack>
        </Surface>
        */}
        <Spacer height={24} />
        <SegmentedControlGroup
          style={{
            position: 'sticky',
            top: 40,
            paddingTop: 4,
            backgroundColor: 'var(--background)',
          }}
        >
          <SegmentedControlLink to="/overview/nfts">
            {' '}
            NFTs{' '}
          </SegmentedControlLink>
          <SegmentedControlLink to="/overview" end={true}>
            Tokens
          </SegmentedControlLink>
          <SegmentedControlLink to="/history">
            History <PendingTransactionsIndicator />
          </SegmentedControlLink>
        </SegmentedControlGroup>
        <Spacer height={24} />
        <Routes>
          <Route path="/" element={<Positions />} />
          <Route path="/nfts" element={<div>NFTs</div>} />
        </Routes>
        <Spacer height={24} />
      </PageColumn>
    </Background>
  );
}

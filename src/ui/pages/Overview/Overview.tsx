import React from 'react';
import { useMutation, useQuery } from 'react-query';
import { Link, useNavigate } from 'react-router-dom';
import { useAddressPortfolio } from 'defi-sdk';
import { UIText } from 'src/ui/ui-kit/UIText';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { accountPublicRPCPort, walletPort } from 'src/ui/shared/channels';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { Surface } from 'src/ui/ui-kit/Surface';
import { truncateAddress } from 'src/ui/shared/truncateAddress';
import { PageHeading } from 'src/ui/components/PageHeading';
import { BlockieImg } from 'src/ui/components/BlockieImg';
import { Background } from 'src/ui/components/Background';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { createChain } from 'src/modules/networks/Chain';
import {
  formatCurrencyToParts,
  formatCurrencyValue,
} from 'src/shared/units/formatCurrencyValue';
import { formatPercent } from 'src/shared/units/formatPercent/formatPercent';
import { Twinkle } from 'src/ui/ui-kit/Twinkle';
import ZerionSquircle from 'src/ui/assets/zerion-squircle.svg';
import { FillView } from 'src/ui/components/FillView';
import { HStack } from 'src/ui/ui-kit/HStack';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { usePendingTransactions } from 'src/ui/transactions/usePendingTransactions';
import { NeutralDecimals } from 'src/ui/ui-kit/NeutralDecimals';
import { SettingsLinkIcon } from '../Settings/SettingsLinkIcon';

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
        style={{ width: 8, height: 8, position: 'relative', top: 4 }}
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

function NetworkSwitcher() {
  const { networks } = useNetworks();

  const { data: chainId, ...chainIdQuery } = useQuery('wallet/chainId', () =>
    walletPort.request('getChainId')
  );

  const switchChainMutation = useMutation(
    (chain: string) => walletPort.request('switchChain', chain),
    { onSuccess: () => chainIdQuery.refetch() }
  );
  return networks && chainId ? (
    <div>
      <select
        name="chain"
        value={networks.getNetworkById(chainId || '0x1')?.chain ?? null}
        onChange={(event) => {
          switchChainMutation.mutate(event.target.value);
        }}
      >
        {networks?.getNetworks().map((network) => (
          <option key={network.chain} value={network.chain}>
            {networks.getChainName(createChain(network.name))}
          </option>
        ))}
      </select>

      <UIText
        kind="caption/reg"
        style={{
          overflow: 'hidden',
          maxWidth: 150,
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {networks && chainId
          ? new URL(networks.getRpcUrlInternal(networks.getChainById(chainId)))
              .hostname
          : null}
      </UIText>
    </div>
  ) : null;
}

export function Overview() {
  const navigate = useNavigate();
  const logout = useMutation(() => accountPublicRPCPort.request('logout'));

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
        <div style={{ position: 'absolute', right: 16, top: 16 }}>
          <SettingsLinkIcon />
        </div>
        <PageTop />
        <PageHeading>Summary</PageHeading>
        <Spacer height={24} />
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
        <Spacer height={8} />
        <Surface style={{ padding: 12 }}>
          <HStack gap={12}>
            <BlockieImg address={params.address} size={44} />
            <div>
              <UIText kind="subtitle/l_reg" title={params.address}>
                {truncateAddress(params.address, 4)}
              </UIText>
              <UIText kind="h/6_med">
                <NeutralDecimals
                  parts={formatCurrencyToParts(
                    value?.total_value ?? 0,
                    'en',
                    'usd'
                  )}
                />
              </UIText>
            </div>
          </HStack>
        </Surface>
        <Spacer height={8} />
        <UIText kind="subtitle/l_reg">
          <HStack gap={4}>
            <Link style={{ color: 'var(--primary)' }} to="/history">
              History
            </Link>
            <PendingTransactionsIndicator />
          </HStack>
        </UIText>
        <div
          style={{ marginTop: 'auto', paddingBottom: 16, textAlign: 'center' }}
        >
          <UnstyledButton
            onClick={async () => {
              await logout.mutateAsync();
              navigate('/login');
            }}
          >
            {logout.isLoading ? 'Locking...' : 'Lock (log out)'}
          </UnstyledButton>
        </div>
      </PageColumn>
    </Background>
  );
}

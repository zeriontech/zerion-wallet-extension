import React from 'react';
import PnlChartIcon from 'jsx:src/ui/assets/pnl-chart.svg';
import { formatCurrencyValue } from 'src/shared/units/formatCurrencyValue';
import { formatPercent } from 'src/shared/units/formatPercent';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { useHttpClientSource } from 'src/modules/zerion-api/hooks/useHttpClientSource';
import { useWalletPnl } from 'src/modules/zerion-api/hooks/useWalletPnl';
import { usePremiumStatus } from 'src/ui/features/premium/getPremiumStatus';
import { BlurrableBalance } from 'src/ui/components/BlurrableBalance';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { minus, NBSP } from 'src/ui/shared/typography';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import { VStack } from 'src/ui/ui-kit/VStack';
import type { Kind } from 'src/ui/ui-kit/UIText';
import * as styles from './Pnl.module.css';

const PLACEHOLDER = '—';

function getColor(value: number | null | undefined) {
  return !value
    ? 'var(--black)'
    : value > 0
    ? 'var(--positive-500)'
    : 'var(--negative-500)';
}

function getSign(value: number | null | undefined) {
  return !value ? '' : value > 0 ? '+' : minus;
}

function PnlValue({
  relative,
  absolute,
  currency,
  textKind,
}: {
  relative: number;
  absolute: number;
  currency: string;
  textKind: Kind;
}) {
  const color = getColor(absolute);
  return (
    <UIText
      kind={textKind}
      color={color}
      style={{ display: 'flex', gap: 4, alignItems: 'flex-end' }}
    >
      <span>{`${getSign(absolute)}${formatPercent(
        Math.abs(relative * 100),
        'en'
      )}%`}</span>
      <BlurrableBalance kind="small/accent" color={color}>
        {`(${formatCurrencyValue(Math.abs(absolute), 'en', currency)})`}
      </BlurrableBalance>
    </UIText>
  );
}

function PnlBreakdownColumn({
  label,
  relative,
  absolute,
  currency,
  isPremium,
  isLoading,
}: {
  label: string;
  relative: number | null | undefined;
  absolute: number | null | undefined;
  currency: string;
  isPremium: boolean;
  isLoading: boolean;
}) {
  return (
    <VStack gap={4} style={{ flexGrow: 1, flexBasis: 0, minWidth: 0 }}>
      <UIText kind="small/regular" color="var(--neutral-500)">
        {label}
      </UIText>
      {isLoading ? (
        <UIText kind="small/accent" color="var(--neutral-500)">
          {NBSP}
        </UIText>
      ) : isPremium && relative != null && absolute != null ? (
        <PnlValue
          relative={relative}
          absolute={absolute}
          currency={currency}
          textKind="small/accent"
        />
      ) : (
        <UIText kind="small/accent" color="var(--neutral-500)">
          {PLACEHOLDER}
        </UIText>
      )}
    </VStack>
  );
}

export function Pnl() {
  const { currency } = useCurrency();
  const { ready, params } = useAddressParams();
  const source = useHttpClientSource();
  const { isPremium, walletsMetaQuery } = usePremiumStatus({
    address: params.address,
  });
  const pnlQuery = useWalletPnl(
    { addresses: [params.address], currency },
    { source },
    { enabled: ready && isPremium }
  );
  const pnl = pnlQuery.data?.data ?? null;

  const checkingPremium = walletsMetaQuery.isInitialLoading;
  const loadingPnl =
    ready && isPremium && pnlQuery.data === undefined && !pnlQuery.isError;
  const isLoading = checkingPremium || loadingPnl;

  return (
    <div style={{ paddingInline: 'var(--column-padding-inline)' }}>
      <VStack
        gap={16}
        style={{
          border: '2px solid var(--neutral-200)',
          borderRadius: 16,
          padding: 16,
        }}
      >
        <VStack gap={8}>
          <HStack gap={8} alignItems="center">
            <PnlChartIcon style={{ width: 24, height: 24 }} />
            <UIText kind="body/accent" color="var(--black)">
              All-time PnL
            </UIText>
          </HStack>
          {isLoading ? (
            <UIText kind="headline/h2" color="var(--neutral-500)">
              {NBSP}
            </UIText>
          ) : !isPremium ? (
            <UnstyledLink to="/premium">
              <UIText kind="headline/h2" className={styles.gradientText}>
                Get Premium
              </UIText>
            </UnstyledLink>
          ) : pnl ? (
            <PnlValue
              relative={pnl.relativeTotalPnl}
              absolute={pnl.totalPnl}
              currency={currency}
              textKind="headline/h2"
            />
          ) : (
            <UIText kind="headline/h2" color="var(--neutral-500)">
              {PLACEHOLDER}
            </UIText>
          )}
        </VStack>
        <HStack gap={16}>
          <PnlBreakdownColumn
            label="Realized PnL"
            relative={pnl?.relativeRealizedPnl}
            absolute={pnl?.realizedPnl}
            currency={currency}
            isPremium={isPremium}
            isLoading={isLoading}
          />
          <PnlBreakdownColumn
            label="Unrealized PnL"
            relative={pnl?.relativeUnrealizedPnl}
            absolute={pnl?.unrealizedPnl}
            currency={currency}
            isPremium={isPremium}
            isLoading={isLoading}
          />
        </HStack>
      </VStack>
    </div>
  );
}

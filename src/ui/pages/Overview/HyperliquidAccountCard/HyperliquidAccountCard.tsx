import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useHyperliquidAccountSummary } from 'src/modules/hyperliquid/hooks/useHyperliquidAccountSummary';
import { usePerpsRemoteConfig } from 'src/modules/hyperliquid/hooks/usePerpsRemoteConfig';
import { builderFeeUnitToMaxFeeRateString } from 'src/modules/hyperliquid/fees/calculateFeeRate';
import { getPerpIconUrl } from 'src/modules/hyperliquid/getPerpIconUrl';
import { formatCurrencyValue } from 'src/shared/units/formatCurrencyValue';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { Button } from 'src/ui/ui-kit/Button';
import { Frame } from 'src/ui/ui-kit/Frame';
import { HStack } from 'src/ui/ui-kit/HStack';
import { TokenIcon } from 'src/ui/ui-kit/TokenIcon';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import CheckIcon from 'jsx:src/ui/assets/checkmark-checked.svg';
import { emitter } from 'src/ui/shared/events';
import type { HyperliquidAccountCardParams } from 'src/shared/types/hyperliquid-events';

function formatSignedCurrency(value: number, currency: string) {
  const formatted = formatCurrencyValue(value, 'en', currency);
  return value > 0 ? `+${formatted}` : formatted;
}

function PositionRow({
  coin,
  szi,
  leverage,
  unrealizedPnl,
  currency,
}: {
  coin: string;
  szi: string;
  leverage: number;
  unrealizedPnl: number;
  currency: string;
}) {
  const isLong = Number(szi) > 0;
  return (
    <HStack gap={8} alignItems="center" justifyContent="space-between">
      <HStack gap={8} alignItems="center">
        <TokenIcon src={getPerpIconUrl(coin)} symbol={coin} size={24} />
        <UIText kind="body/accent">{coin}</UIText>
        <UIText
          kind="caption/regular"
          style={{
            color: isLong ? 'var(--positive-500)' : 'var(--negative-500)',
            backgroundColor: isLong ? 'var(--positive-100)' : 'var(--negative-100)',
            borderRadius: 6,
            padding: '2px 6px',
          }}
        >
          {isLong ? 'Long' : 'Short'} {leverage}x
        </UIText>
      </HStack>
      <UIText
        kind="body/accent"
        color={unrealizedPnl >= 0 ? 'var(--positive-500)' : 'var(--negative-500)'}
      >
        {formatSignedCurrency(unrealizedPnl, currency)}
      </UIText>
    </HStack>
  );
}

function ChecklistLine({ children }: React.PropsWithChildren) {
  return (
    <HStack gap={8} alignItems="center">
      <CheckIcon style={{ width: 16, height: 16, color: 'var(--positive-500)', flexShrink: 0 }} />
      <UIText kind="small/regular" color="var(--neutral-600)">
        {children}
      </UIText>
    </HStack>
  );
}

export function HyperliquidAccountCard({
  address,
  isActiveTabHyperliquid,
  onManage,
}: {
  address: string;
  /** True when app.hyperliquid.xyz is the active tab. */
  isActiveTabHyperliquid: boolean;
  onManage: () => void;
}) {
  const { currency } = useCurrency();
  const summary = useHyperliquidAccountSummary({ address });
  const { data: config } = usePerpsRemoteConfig();
  const [dismissed, setDismissed] = useState(false);
  const hasEmittedShown = useRef(false);

  const positions = summary.allPositions;
  const totalUnrealizedPnl = useMemo(
    () =>
      positions.reduce((sum, position) => {
        const value = Number(position.unrealizedPnl);
        return Number.isFinite(value) ? sum + value : sum;
      }, 0),
    [positions],
  );

  const hasAccount = positions.length > 0 || summary.effectiveAccountValueUSD > 0;
  const shouldRender = hasAccount || (isActiveTabHyperliquid && !summary.isLoading);
  const source: HyperliquidAccountCardParams['source'] = isActiveTabHyperliquid
    ? 'active_tab'
    : 'account';

  useEffect(() => {
    if (hasEmittedShown.current || !shouldRender) return;
    hasEmittedShown.current = true;
    emitter.emit('hyperliquidAccountCard', {
      action: 'shown',
      equity_usd: summary.effectiveAccountValueUSD,
      unrealized_pnl_usd: totalUnrealizedPnl,
      positions_count: positions.length,
      source,
    });
  }, [
    shouldRender,
    summary.effectiveAccountValueUSD,
    totalUnrealizedPnl,
    positions.length,
    source,
  ]);

  if (dismissed || !shouldRender) {
    return null;
  }

  const standardFee =
    config?.builderFee != null && config.builderFee > 0
      ? builderFeeUnitToMaxFeeRateString(config.builderFee)
      : null;
  const premiumFee =
    config?.builderFeePremium != null && config.builderFeePremium > 0
      ? builderFeeUnitToMaxFeeRateString(config.builderFeePremium)
      : null;

  return (
    <div style={{ paddingInline: 'var(--column-padding-inline)', paddingTop: 16 }}>
      <Frame style={{ padding: 16 }}>
        <VStack gap={12}>
          <HStack gap={8} alignItems="center" justifyContent="space-between">
            <UIText kind="caption/accent" color="var(--neutral-600)">
              YOUR HYPERLIQUID ACCOUNT
            </UIText>
            <UIText kind="caption/regular" color="var(--neutral-500)">
              Hyperliquid
            </UIText>
          </HStack>
          <VStack gap={2}>
            <UIText
              kind="headline/h1"
              style={{ fontSize: 32, lineHeight: '38px', letterSpacing: '-0.02em' }}
            >
              {formatCurrencyValue(summary.effectiveAccountValueUSD, 'en', currency)}
            </UIText>
            <UIText
              kind="body/accent"
              color={totalUnrealizedPnl >= 0 ? 'var(--positive-500)' : 'var(--negative-500)'}
            >
              {formatSignedCurrency(totalUnrealizedPnl, currency)} unrealized PnL
            </UIText>
          </VStack>
          {positions.length > 0 ? (
            <VStack gap={8}>
              {positions.slice(0, 3).map((position) => (
                <PositionRow
                  key={`${position.coin}:${position.szi}`}
                  coin={position.coin}
                  szi={position.szi}
                  leverage={position.leverage.value}
                  unrealizedPnl={Number(position.unrealizedPnl)}
                  currency={currency}
                />
              ))}
            </VStack>
          ) : (
            <UIText kind="small/regular" color="var(--neutral-500)">
              No open Hyperliquid positions.
            </UIText>
          )}
          <VStack gap={6}>
            <ChecklistLine>TP/SL and liquidation alerts</ChecklistLine>
            <ChecklistLine>Positions next to your whole portfolio</ChecklistLine>
            <ChecklistLine>Same Hyperliquid order book and account</ChecklistLine>
          </VStack>
          {standardFee ? (
            <UIText kind="small/regular" color="var(--neutral-500)">
              Orders placed in Zerion carry a {standardFee} Zerion fee
              {premiumFee ? ` (${premiumFee} with Premium)` : ''} on top of Hyperliquid&apos;s fee.
            </UIText>
          ) : null}
          <HStack gap={8} style={{ gridTemplateColumns: '1fr 1fr' }}>
            <Button
              kind="regular"
              onClick={() => {
                setDismissed(true);
                emitter.emit('hyperliquidAccountCard', {
                  action: 'dismissed',
                  equity_usd: summary.effectiveAccountValueUSD,
                  unrealized_pnl_usd: totalUnrealizedPnl,
                  positions_count: positions.length,
                  source,
                });
              }}
            >
              Stay here
            </Button>
            <Button
              onClick={() => {
                emitter.emit('hyperliquidAccountCard', {
                  action: 'clicked_manage',
                  equity_usd: summary.effectiveAccountValueUSD,
                  unrealized_pnl_usd: totalUnrealizedPnl,
                  positions_count: positions.length,
                  source,
                });
                onManage();
              }}
            >
              Manage in Zerion
            </Button>
          </HStack>
        </VStack>
      </Frame>
    </div>
  );
}

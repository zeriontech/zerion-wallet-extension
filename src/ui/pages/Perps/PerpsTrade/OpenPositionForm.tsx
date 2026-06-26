import React, { useEffect } from 'react';
import PlusIcon from 'jsx:src/ui/assets/plus.svg';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { formatCurrencyValue } from 'src/shared/units/formatCurrencyValue';
import { formatPriceValue } from 'src/shared/units/formatPriceValue';
import type { PerpAssetEntry } from 'src/modules/hyperliquid/findPerpAsset';
import { calculatePositionSize } from 'src/modules/hyperliquid/calc/calculatePositionSize';
import { calculateIsolatedLiquidationPrice } from 'src/modules/hyperliquid/calc/calculateLiquidationPrice';
import { MIN_ORDER_NOTIONAL_USD } from 'src/modules/hyperliquid/constants';
import { PERPS_BUTTON, PERPS_SCREEN } from 'src/shared/types/perps-events';
import { emitter } from 'src/ui/shared/events';
import { Frame } from 'src/ui/ui-kit/Frame';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { VStack } from 'src/ui/ui-kit/VStack';
import { BlurrableBalance } from 'src/ui/components/BlurrableBalance';
import { CenteredAmountInput } from './CenteredAmountInput';
import * as s from './styles.module.css';
import type { TradeFormState, TradeSide } from './useTradeFormState';

const PRESET_PERCENTS = [10, 25, 50, 100] as const;

function clampDecimal(raw: string): string {
  const sanitized = raw.replace(/[^0-9.]/g, '');
  const firstDot = sanitized.indexOf('.');
  if (firstDot === -1) return sanitized;
  return (
    sanitized.slice(0, firstDot + 1) +
    sanitized.slice(firstDot + 1).replace(/\./g, '')
  );
}

function formatTriggerPrice(price: string, currency: string): string | null {
  const value = Number(price);
  if (!price || !Number.isFinite(value) || value <= 0) return null;
  return formatPriceValue(value, 'en', currency);
}

export function OpenPositionForm({
  asset,
  markPrice,
  availableToTrade,
  formState,
  onChange,
  onOpenLeverage,
  onOpenAutoClose,
  totalFeeRate,
  onFeeBreakdownClick,
}: {
  asset: PerpAssetEntry;
  markPrice: number;
  availableToTrade: number;
  formState: TradeFormState;
  onChange: (patch: Partial<TradeFormState>) => void;
  onOpenLeverage: () => void;
  onOpenAutoClose: () => void;
  totalFeeRate: number;
  onFeeBreakdownClick?: () => void;
}) {
  const { currency } = useCurrency();
  const side: TradeSide = formState.side ?? 'long';
  const screenName = side === 'long' ? PERPS_SCREEN.Long : PERPS_SCREEN.Short;
  const assetName = asset.universe.name;
  useEffect(() => {
    emitter.emit('perpsScreenViewed', {
      screen_name: screenName,
      asset_name: assetName,
    });
  }, [screenName, assetName]);

  const leverage = formState.leverage ?? 1;
  const inputAmount = formState.inputAmount;
  const marginUsd = Number(inputAmount) || 0;
  const szDecimals = asset.universe.szDecimals;
  const takeProfitDisplay = formatTriggerPrice(
    formState.takeProfitPrice,
    currency
  );
  const stopLossDisplay = formatTriggerPrice(formState.stopLossPrice, currency);

  const positionSize = calculatePositionSize({
    margin: marginUsd,
    leverage,
    entryPrice: markPrice,
    szDecimals,
  });
  const notional = positionSize * markPrice;
  const feeCost = notional * totalFeeRate;

  const floatSide = side === 'long' ? 1 : -1;
  const updatedPosition = floatSide * positionSize;
  const liquidationPrice =
    positionSize > 0
      ? calculateIsolatedLiquidationPrice({
          mid: markPrice,
          floatSide,
          leverage: { value: leverage, rawUsd: 0 },
          positionSzi: 0,
          userSz: positionSize,
          totalNtlPos: notional,
          updatedPosition,
          maxLeverage: asset.universe.maxLeverage,
        })
      : null;

  function handleAmountChange(raw: string) {
    onChange({ inputAmount: clampDecimal(raw) });
  }

  function handlePercent(percent: number) {
    const next = (availableToTrade * percent) / 100;
    onChange({ inputAmount: next > 0 ? next.toFixed(2) : '' });
  }

  return (
    <VStack gap={16}>
      <div className={s.sideSelector}>
        <UnstyledButton
          type="button"
          className={
            side === 'long'
              ? `${s.sideButton} ${s.sideButtonLongActive}`
              : s.sideButton
          }
          onClick={() => onChange({ side: 'long' })}
        >
          Long
        </UnstyledButton>
        <UnstyledButton
          type="button"
          className={
            side === 'short'
              ? `${s.sideButton} ${s.sideButtonShortActive}`
              : s.sideButton
          }
          onClick={() => onChange({ side: 'short' })}
        >
          Short
        </UnstyledButton>
      </div>

      <VStack gap={4}>
        <CenteredAmountInput
          value={inputAmount}
          onChange={handleAmountChange}
        />
        <UIText
          kind="caption/regular"
          color="var(--neutral-600)"
          style={{
            display: 'flex',
            gap: 4,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <span>Available</span>
          <BlurrableBalance kind="caption/regular" color="var(--neutral-600)">
            {formatCurrencyValue(availableToTrade, 'en', currency)}
          </BlurrableBalance>
        </UIText>
      </VStack>

      <div className={s.percentRow}>
        {PRESET_PERCENTS.map((percent) => (
          <UnstyledButton
            key={percent}
            type="button"
            className={s.percentChip}
            onClick={() => handlePercent(percent)}
          >
            {percent}%
          </UnstyledButton>
        ))}
      </div>

      <Frame>
        <VStack gap={12} className={s.controlGroupBody}>
          <UnstyledButton
            type="button"
            className={s.controlGroupRow}
            onClick={() => {
              emitter.emit('perpsButtonPressed', {
                button_name: PERPS_BUTTON.AdjustLeverage,
                screen_name: screenName,
              });
              onOpenLeverage();
            }}
          >
            <VStack gap={0} className={s.controlGroupRowLeft}>
              <UIText kind="small/accent">Leverage</UIText>
              <UIText kind="small/regular" color="var(--neutral-600)">
                Liquidation at{' '}
                {liquidationPrice != null
                  ? formatPriceValue(liquidationPrice, 'en', currency)
                  : '$0'}
              </UIText>
            </VStack>
            <HStack gap={4} alignItems="center" className={s.controlChip}>
              <UIText kind="small/accent">{leverage}x</UIText>
            </HStack>
          </UnstyledButton>

          <div className={s.frameDivider} />

          <UnstyledButton
            type="button"
            className={s.controlGroupRow}
            onClick={() => {
              emitter.emit('perpsButtonPressed', {
                button_name: PERPS_BUTTON.TakeProfitStopLoss,
                screen_name: screenName,
              });
              onOpenAutoClose();
            }}
          >
            <VStack gap={2} className={s.controlGroupRowLeft}>
              <UIText kind="small/accent">Take Profit / Stop Loss</UIText>
              <UIText kind="small/regular" color="var(--neutral-600)">
                {takeProfitDisplay ? <span>{takeProfitDisplay}</span> : null}
                {takeProfitDisplay && stopLossDisplay ? ' / ' : null}
                {stopLossDisplay ? <span>{stopLossDisplay}</span> : null}
              </UIText>
            </VStack>
            <HStack gap={4} alignItems="center" className={s.controlChip}>
              <PlusIcon style={{ width: 16, height: 16 }} />
              <UIText kind="small/accent">Set Up</UIText>
            </HStack>
          </UnstyledButton>
        </VStack>
      </Frame>

      <Frame>
        <VStack gap={12} className={s.controlGroupBody}>
          <HStack gap={8} justifyContent="space-between" alignItems="center">
            <UIText kind="small/regular" color="var(--neutral-600)">
              Order size
            </UIText>
            <UIText kind="small/accent">
              {positionSize > 0 ? (
                <BlurrableBalance kind="small/accent" color="var(--black)">
                  {`${positionSize.toFixed(Math.max(szDecimals, 2))} ${
                    asset.universe.name
                  }`}
                </BlurrableBalance>
              ) : (
                '—'
              )}
            </UIText>
          </HStack>
          <div className={s.frameDivider} />
          <UnstyledButton
            type="button"
            className={s.controlGroupRow}
            onClick={onFeeBreakdownClick}
            style={{ cursor: onFeeBreakdownClick ? 'pointer' : 'default' }}
          >
            <UIText kind="small/regular" color="var(--neutral-600)">
              Fee
            </UIText>
            <UIText kind="small/accent" style={{ display: 'flex', gap: 4 }}>
              <span>{(totalFeeRate * 100).toFixed(3)}%</span>
              <BlurrableBalance kind="small/accent" color="var(--black)">
                ({formatCurrencyValue(feeCost, 'en', currency)})
              </BlurrableBalance>
            </UIText>
          </UnstyledButton>
        </VStack>
      </Frame>

      {notional > 0 && notional < MIN_ORDER_NOTIONAL_USD ? (
        <UIText kind="caption/regular" className={s.error}>
          Order must be at least ${MIN_ORDER_NOTIONAL_USD}. Increase the amount
          or leverage.
        </UIText>
      ) : null}
    </VStack>
  );
}

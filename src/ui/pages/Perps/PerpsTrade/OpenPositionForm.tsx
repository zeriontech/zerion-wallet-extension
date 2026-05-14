import React from 'react';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { formatCurrencyValue } from 'src/shared/units/formatCurrencyValue';
import { formatPriceValue } from 'src/shared/units/formatPriceValue';
import type { PerpAssetEntry } from 'src/modules/hyperliquid/findPerpAsset';
import { calculatePositionSize } from 'src/modules/hyperliquid/calc/calculatePositionSize';
import { calculateIsolatedLiquidationPrice } from 'src/modules/hyperliquid/calc/calculateLiquidationPrice';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { UnstyledInput } from 'src/ui/ui-kit/UnstyledInput';
import { VStack } from 'src/ui/ui-kit/VStack';
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

function summarizeAutoClose(formState: TradeFormState): string {
  const { takeProfitPrice, stopLossPrice } = formState;
  if (!takeProfitPrice && !stopLossPrice) return 'None';
  const parts: string[] = [];
  if (takeProfitPrice) parts.push(`TP $${takeProfitPrice}`);
  if (stopLossPrice) parts.push(`SL $${stopLossPrice}`);
  return parts.join(' · ');
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
  const leverage = formState.leverage ?? 1;
  const inputAmount = formState.inputAmount;
  const marginUsd = Number(inputAmount) || 0;
  const szDecimals = asset.universe.szDecimals;

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

      <div className={s.row}>
        <UIText kind="caption/regular" color="var(--neutral-600)">
          Amount (USD)
        </UIText>
        <HStack gap={8} alignItems="center">
          <UIText kind="headline/h2" style={{ flex: 1 }}>
            <UnstyledInput
              inputMode="decimal"
              placeholder="0"
              autoFocus={true}
              value={inputAmount}
              onChange={(e) => handleAmountChange(e.currentTarget.value)}
              className={s.amountInput}
            />
          </UIText>
          <span className={s.usdLabel}>USD</span>
        </HStack>
        <UIText kind="caption/regular" color="var(--neutral-600)">
          Available {formatCurrencyValue(availableToTrade, 'en', currency)}
        </UIText>
      </div>

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

      <UnstyledButton
        type="button"
        className={s.rowAction}
        onClick={onOpenLeverage}
      >
        <UIText kind="body/accent">Leverage</UIText>
        <span className={s.rowActionRight}>
          <UIText kind="body/accent">{leverage}x</UIText>
        </span>
      </UnstyledButton>

      <UnstyledButton
        type="button"
        className={s.rowAction}
        onClick={onOpenAutoClose}
      >
        <UIText kind="body/accent">Take Profit / Stop Loss</UIText>
        <span className={s.rowActionRight}>
          <UIText kind="caption/regular" color="var(--neutral-600)">
            {summarizeAutoClose(formState)}
          </UIText>
        </span>
      </UnstyledButton>

      <VStack gap={4} className={s.statsList}>
        <div className={s.detailRow}>
          <UIText kind="caption/regular" color="var(--neutral-600)">
            Order size
          </UIText>
          <UIText kind="caption/accent">
            {positionSize > 0
              ? `${positionSize.toFixed(Math.max(szDecimals, 2))} ${
                  asset.universe.name
                }`
              : '—'}
          </UIText>
        </div>
        <div className={s.detailRow}>
          <UIText kind="caption/regular" color="var(--neutral-600)">
            Liquidation price
          </UIText>
          <UIText kind="caption/accent">
            {liquidationPrice != null
              ? formatPriceValue(liquidationPrice, 'en', currency)
              : '—'}
          </UIText>
        </div>
        <UnstyledButton
          type="button"
          className={s.detailRow}
          onClick={onFeeBreakdownClick}
          style={{ cursor: onFeeBreakdownClick ? 'pointer' : 'default' }}
        >
          <UIText kind="caption/regular" color="var(--neutral-600)">
            Fee
          </UIText>
          <UIText kind="caption/accent">
            {(totalFeeRate * 100).toFixed(3)}% (
            {formatCurrencyValue(feeCost, 'en', currency)})
          </UIText>
        </UnstyledButton>
      </VStack>
    </VStack>
  );
}

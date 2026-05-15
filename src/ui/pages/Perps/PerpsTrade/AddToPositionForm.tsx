import React from 'react';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { formatCurrencyValue } from 'src/shared/units/formatCurrencyValue';
import { formatPriceValue } from 'src/shared/units/formatPriceValue';
import type { PerpAssetEntry } from 'src/modules/hyperliquid/findPerpAsset';
import type { PerpPosition } from 'src/modules/hyperliquid/api/requests/perp-clearinghouse-state.types';
import { calculatePositionSize } from 'src/modules/hyperliquid/calc/calculatePositionSize';
import { calculateIsolatedLiquidationPrice } from 'src/modules/hyperliquid/calc/calculateLiquidationPrice';
import { MIN_ORDER_NOTIONAL_USD } from 'src/modules/hyperliquid/constants';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { VStack } from 'src/ui/ui-kit/VStack';
import { CenteredAmountInput } from './CenteredAmountInput';
import * as s from './styles.module.css';
import type { TradeFormState } from './useTradeFormState';

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

export function AddToPositionForm({
  asset,
  position,
  markPrice,
  availableToTrade,
  formState,
  onChange,
  totalFeeRate,
  onFeeBreakdownClick,
}: {
  asset: PerpAssetEntry;
  position: PerpPosition;
  markPrice: number;
  availableToTrade: number;
  formState: TradeFormState;
  onChange: (patch: Partial<TradeFormState>) => void;
  totalFeeRate: number;
  onFeeBreakdownClick?: () => void;
}) {
  const { currency } = useCurrency();
  const positionSzi = Number(position.szi);
  const isLong = positionSzi >= 0;
  const positionAbsSize = Math.abs(positionSzi);
  const positionLeverage = position.leverage.value;
  const inputAmount = formState.inputAmount;
  const marginUsd = Number(inputAmount) || 0;
  const szDecimals = asset.universe.szDecimals;

  // Add-to uses the existing position's leverage; user can't change it here.
  const addSize = calculatePositionSize({
    margin: marginUsd,
    leverage: positionLeverage,
    entryPrice: markPrice,
    szDecimals,
  });
  const addNotional = addSize * markPrice;
  const feeCost = addNotional * totalFeeRate;

  const floatSide = isLong ? 1 : -1;
  const newPositionSzi = positionSzi + floatSide * addSize;
  const totalNtlPos = Math.abs(newPositionSzi * markPrice);
  const newLiquidationPrice =
    addSize > 0
      ? calculateIsolatedLiquidationPrice({
          mid: markPrice,
          floatSide,
          leverage: {
            value: positionLeverage,
            rawUsd: Number(position.leverage.rawUsd ?? 0),
          },
          positionSzi,
          userSz: addSize,
          totalNtlPos,
          updatedPosition: newPositionSzi,
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
      <div className={s.borderedFrame}>
        <VStack gap={4}>
          <UIText kind="caption/regular" color="var(--neutral-600)">
            Adding to {isLong ? 'Long' : 'Short'} · {positionLeverage}x
          </UIText>
          <HStack gap={8} alignItems="baseline">
            <UIText kind="body/accent">
              {positionAbsSize.toFixed(Math.max(szDecimals, 2))}{' '}
              {asset.universe.name}
            </UIText>
            <UIText kind="caption/regular" color="var(--neutral-600)">
              @ {formatPriceValue(Number(position.entryPx), 'en', currency)}
            </UIText>
          </HStack>
        </VStack>
      </div>

      <VStack gap={4}>
        <CenteredAmountInput
          value={inputAmount}
          onChange={handleAmountChange}
        />
        <UIText
          kind="caption/regular"
          color="var(--neutral-600)"
          style={{ textAlign: 'center' }}
        >
          Available {formatCurrencyValue(availableToTrade, 'en', currency)}
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

      <VStack gap={4} className={s.borderedFrame}>
        <div className={s.detailRow}>
          <UIText kind="caption/regular" color="var(--neutral-600)">
            Add size
          </UIText>
          <UIText kind="caption/accent">
            {addSize > 0
              ? `${addSize.toFixed(Math.max(szDecimals, 2))} ${
                  asset.universe.name
                }`
              : '—'}
          </UIText>
        </div>
        <div className={s.detailRow}>
          <UIText kind="caption/regular" color="var(--neutral-600)">
            New liquidation price
          </UIText>
          <UIText kind="caption/accent">
            {newLiquidationPrice != null
              ? formatPriceValue(newLiquidationPrice, 'en', currency)
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

      {addNotional > 0 && addNotional < MIN_ORDER_NOTIONAL_USD ? (
        <UIText kind="caption/regular" className={s.error}>
          Add must be at least ${MIN_ORDER_NOTIONAL_USD}. Position leverage is{' '}
          {positionLeverage}x — increase the amount to clear the minimum.
        </UIText>
      ) : null}
    </VStack>
  );
}

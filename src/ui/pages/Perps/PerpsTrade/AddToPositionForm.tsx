import React, { useEffect } from 'react';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { formatCurrencyValue } from 'src/shared/units/formatCurrencyValue';
import { formatPriceValue } from 'src/shared/units/formatPriceValue';
import { formatTokenValue } from 'src/shared/units/formatTokenValue';
import type { PerpAssetEntry } from 'src/modules/hyperliquid/findPerpAsset';
import type { PerpPosition } from 'src/modules/hyperliquid/api/requests/perp-clearinghouse-state.types';
import { calculatePositionSize } from 'src/modules/hyperliquid/calc/calculatePositionSize';
import { calculateIsolatedLiquidationPrice } from 'src/modules/hyperliquid/calc/calculateLiquidationPrice';
import { MIN_ORDER_NOTIONAL_USD } from 'src/modules/hyperliquid/constants';
import { getPerpDisplayName } from 'src/modules/hyperliquid/parsePerpId';
import { PERPS_SCREEN } from 'src/shared/types/perps-events';
import { emitter } from 'src/ui/shared/events';
import { Frame } from 'src/ui/ui-kit/Frame';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { VStack } from 'src/ui/ui-kit/VStack';
import { BlurrableBalance } from 'src/ui/components/BlurrableBalance';
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
  const screenName = isLong ? PERPS_SCREEN.AddToLong : PERPS_SCREEN.AddToShort;
  const assetName = asset.universe.name;
  useEffect(() => {
    emitter.emit('perpsScreenViewed', {
      screen_name: screenName,
      asset_name: assetName,
    });
  }, [screenName, assetName]);

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
      <VStack gap={4}>
        <CenteredAmountInput
          value={inputAmount}
          onChange={handleAmountChange}
        />
        <UIText
          kind="small/accent"
          color="var(--neutral-600)"
          style={{
            display: 'flex',
            gap: 4,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <span>Size</span>
          <BlurrableBalance kind="small/accent" color="var(--neutral-600)">
            {formatCurrencyValue(marginUsd, 'en', currency)}
            {addSize > 0
              ? ` · ${formatTokenValue(addSize, asset.universe.name)}`
              : ''}
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
          <HStack gap={8} justifyContent="space-between" alignItems="center">
            <UIText kind="small/regular" color="var(--neutral-600)">
              Available
            </UIText>
            <UIText kind="small/accent">
              <BlurrableBalance kind="small/accent" color="var(--black)">
                {formatCurrencyValue(availableToTrade, 'en', currency)}
              </BlurrableBalance>
            </UIText>
          </HStack>
          <div className={s.frameDivider} />
          <HStack gap={8} justifyContent="space-between" alignItems="center">
            <UIText kind="small/regular" color="var(--neutral-600)">
              Adding to {isLong ? 'Long' : 'Short'}
            </UIText>
            <UIText kind="small/accent">
              <BlurrableBalance kind="small/accent" color="var(--black)">
                {positionAbsSize.toFixed(Math.max(szDecimals, 2))}{' '}
                {getPerpDisplayName(asset.universe.name)} ·{' '}
                {formatCurrencyValue(
                  Number(position.marginUsed),
                  'en',
                  currency
                )}
              </BlurrableBalance>
            </UIText>
          </HStack>
          <div className={s.frameDivider} />
          <HStack gap={8} justifyContent="space-between" alignItems="center">
            <UIText kind="small/regular" color="var(--neutral-600)">
              Leverage
            </UIText>
            <UIText kind="small/accent">{positionLeverage}x</UIText>
          </HStack>
        </VStack>
      </Frame>

      <Frame>
        <VStack gap={12} className={s.controlGroupBody}>
          <HStack gap={8} justifyContent="space-between" alignItems="center">
            <UIText kind="small/regular" color="var(--neutral-600)">
              Add size
            </UIText>
            <UIText kind="small/accent">
              {addSize > 0 ? (
                <BlurrableBalance kind="small/accent" color="var(--black)">
                  {`${addSize.toFixed(Math.max(szDecimals, 2))} ${
                    asset.universe.name
                  }`}
                </BlurrableBalance>
              ) : (
                '—'
              )}
            </UIText>
          </HStack>
          <div className={s.frameDivider} />
          <HStack gap={8} justifyContent="space-between" alignItems="center">
            <UIText kind="small/regular" color="var(--neutral-600)">
              New liquidation price
            </UIText>
            <UIText kind="small/accent">
              {newLiquidationPrice != null
                ? formatPriceValue(newLiquidationPrice, 'en', currency)
                : '—'}
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

      {addNotional > 0 && addNotional < MIN_ORDER_NOTIONAL_USD ? (
        <UIText kind="caption/regular" className={s.error}>
          Add must be at least ${MIN_ORDER_NOTIONAL_USD}. Position leverage is{' '}
          {positionLeverage}x — increase the amount to clear the minimum.
        </UIText>
      ) : null}
    </VStack>
  );
}

import React from 'react';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { formatCurrencyValue } from 'src/shared/units/formatCurrencyValue';
import { formatTokenValue } from 'src/shared/units/formatTokenValue';
import type { PerpAssetEntry } from 'src/modules/hyperliquid/findPerpAsset';
import type { PerpPosition } from 'src/modules/hyperliquid/api/requests/perp-clearinghouse-state.types';
import { MIN_ORDER_NOTIONAL_USD } from 'src/modules/hyperliquid/constants';
import { Frame } from 'src/ui/ui-kit/Frame';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { VStack } from 'src/ui/ui-kit/VStack';
import { CenteredAmountInput } from './CenteredAmountInput';
import * as s from './styles.module.css';
import type { TradeFormState } from './useTradeFormState';

const PRESET_PERCENTS = [25, 50, 75, 100] as const;

function clampDecimal(raw: string): string {
  const sanitized = raw.replace(/[^0-9.]/g, '');
  const firstDot = sanitized.indexOf('.');
  if (firstDot === -1) return sanitized;
  return (
    sanitized.slice(0, firstDot + 1) +
    sanitized.slice(firstDot + 1).replace(/\./g, '')
  );
}

export function ClosePositionForm({
  asset,
  position,
  markPrice,
  formState,
  onChange,
  totalFeeRate,
  onFeeBreakdownClick,
}: {
  asset: PerpAssetEntry;
  position: PerpPosition;
  markPrice: number;
  formState: TradeFormState;
  onChange: (patch: Partial<TradeFormState>) => void;
  totalFeeRate: number;
  onFeeBreakdownClick?: () => void;
}) {
  const { currency } = useCurrency();
  const positionSzi = Number(position.szi);
  const positionAbsSize = Math.abs(positionSzi);
  const positionValueAbs = Math.abs(Number(position.positionValue));
  const positionLeverage = position.leverage.value;
  const positionUnrealizedPnl = Number(position.unrealizedPnl);
  const szDecimals = asset.universe.szDecimals;

  // `inputAmount` here is the USD notional being closed.
  const closeUsd = Number(formState.inputAmount) || 0;
  const remainingUsd = Math.max(positionValueAbs - closeUsd, 0);
  const remainderTooSmall =
    remainingUsd > 0 && remainingUsd < MIN_ORDER_NOTIONAL_USD;
  const exceedsPosition = closeUsd > positionValueAbs;
  const closeFraction =
    positionValueAbs > 0 ? Math.min(closeUsd / positionValueAbs, 1) : 0;
  const closeSize = positionAbsSize * closeFraction;
  const feeCost = closeSize * markPrice * totalFeeRate;
  // Realised PnL on the closed slice scales linearly with the closed fraction.
  const pnlOnClose = positionUnrealizedPnl * closeFraction;
  const isPnlPositive = pnlOnClose >= 0;
  // Notional returned to the available balance: margin freed + PnL − fee.
  const closedMargin =
    positionLeverage > 0 ? closeUsd / positionLeverage : closeUsd;
  const receiveUsd = Math.max(closedMargin + pnlOnClose - feeCost, 0);

  function handleAmountChange(raw: string) {
    onChange({ inputAmount: clampDecimal(raw) });
  }

  function handlePercent(percent: number) {
    if (percent === 100) {
      onChange({
        inputAmount: positionValueAbs > 0 ? String(positionValueAbs) : '',
      });
      return;
    }
    const next = (positionValueAbs * percent) / 100;
    onChange({ inputAmount: next > 0 ? next.toFixed(2) : '' });
  }

  return (
    <VStack gap={16}>
      <VStack gap={4}>
        <CenteredAmountInput
          value={formState.inputAmount}
          onChange={handleAmountChange}
        />
        <UIText
          kind="small/accent"
          color="var(--neutral-600)"
          style={{ textAlign: 'center' }}
        >
          Size {formatCurrencyValue(closeUsd, 'en', currency)}
          {closeSize > 0
            ? ` · ${formatTokenValue(closeSize, asset.universe.name)}`
            : ''}
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
            {percent === 100 ? 'Max' : `${percent}%`}
          </UnstyledButton>
        ))}
      </div>

      <Frame>
        <VStack gap={12} className={s.controlGroupBody}>
          <HStack gap={8} justifyContent="space-between" alignItems="center">
            <UIText kind="small/accent">PnL</UIText>
            <HStack
              gap={4}
              alignItems="center"
              className={s.pnlChip}
              style={{
                backgroundColor: isPnlPositive
                  ? 'var(--positive-200)'
                  : 'var(--negative-200)',
                color: isPnlPositive
                  ? 'var(--positive-500)'
                  : 'var(--negative-500)',
              }}
            >
              <UIText kind="small/accent" color="inherit">
                {isPnlPositive ? '+' : '-'}
                {formatCurrencyValue(Math.abs(pnlOnClose), 'en', currency)}
              </UIText>
            </HStack>
          </HStack>
          <div className={s.frameDivider} />
          <HStack gap={8} justifyContent="space-between" alignItems="center">
            <UIText kind="small/accent">Receive</UIText>
            <UIText kind="small/accent">
              {formatCurrencyValue(receiveUsd, 'en', currency)}
              {closeSize > 0
                ? ` (${formatTokenValue(closeSize, asset.universe.name)})`
                : ''}
            </UIText>
          </HStack>
        </VStack>
      </Frame>

      <Frame>
        <VStack gap={12} className={s.controlGroupBody}>
          <HStack gap={8} justifyContent="space-between" alignItems="center">
            <UIText kind="small/regular" color="var(--neutral-600)">
              Closing size
            </UIText>
            <UIText kind="small/accent">
              {closeSize > 0
                ? `${closeSize.toFixed(Math.max(szDecimals, 2))} ${
                    asset.universe.name
                  }`
                : '—'}
            </UIText>
          </HStack>
          <div className={s.frameDivider} />
          <HStack gap={8} justifyContent="space-between" alignItems="center">
            <UIText kind="small/regular" color="var(--neutral-600)">
              Remaining
            </UIText>
            <UIText kind="small/accent">
              {formatCurrencyValue(remainingUsd, 'en', currency)}
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
            <UIText kind="small/accent">
              {(totalFeeRate * 100).toFixed(3)}% (
              {formatCurrencyValue(feeCost, 'en', currency)})
            </UIText>
          </UnstyledButton>
        </VStack>
      </Frame>

      {remainderTooSmall ? (
        <UIText kind="caption/regular" className={s.error}>
          Remainder must be at least ${MIN_ORDER_NOTIONAL_USD} or close the full
          position.
        </UIText>
      ) : null}
      {exceedsPosition ? (
        <UIText kind="caption/regular" className={s.error}>
          Cannot close more than the position size.
        </UIText>
      ) : null}
    </VStack>
  );
}

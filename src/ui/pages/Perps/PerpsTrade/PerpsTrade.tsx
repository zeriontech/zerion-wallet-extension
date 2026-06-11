import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { invariant } from 'src/shared/invariant';
import { findPerpAsset } from 'src/modules/hyperliquid/findPerpAsset';
import {
  getPerpDisplayName,
  parsePerpId,
} from 'src/modules/hyperliquid/parsePerpId';
import { useClearinghouseState } from 'src/modules/hyperliquid/hooks/useClearinghouseState';
import { useHyperliquidAccountSummary } from 'src/modules/hyperliquid/hooks/useHyperliquidAccountSummary';
import { useMetaAndAssetCtxs } from 'src/modules/hyperliquid/hooks/useMetaAndAssetCtxs';
import { usePerpActiveAssetData } from 'src/modules/hyperliquid/hooks/usePerpActiveAssetData';
import { usePerpDexs } from 'src/modules/hyperliquid/hooks/usePerpDexs';
import {
  markHyperliquidOpSubmitted,
  useHyperliquidRefetchInterval,
} from 'src/modules/hyperliquid/useHyperliquidRefetchInterval';
import { calculateIsolatedLiquidationPrice } from 'src/modules/hyperliquid/calc/calculateLiquidationPrice';
import { calculatePositionSize } from 'src/modules/hyperliquid/calc/calculatePositionSize';
import { calculatePriceWithSlippage } from 'src/modules/hyperliquid/calc/calculatePriceWithSlippage';
import { computeAssetId } from 'src/modules/hyperliquid/calc/computeAssetId';
import {
  formatOrderPrice,
  formatOrderSize,
} from 'src/modules/hyperliquid/calc/formatOrderPriceAndSize';
import {
  buildIocLimitOrderType,
  buildOrderAction,
  buildTriggerOrderType,
} from 'src/modules/hyperliquid/actions/buildOrderAction';
import type { ExchangePlaceOrderPayload } from 'src/modules/hyperliquid/actions/types';
import { MIN_ORDER_NOTIONAL_USD } from 'src/modules/hyperliquid/constants';
import { runPerpsIntent } from 'src/modules/hyperliquid/useCases';
import type { PerpsIntent } from 'src/modules/hyperliquid/useCases/runIntent';
import { getError } from 'src/shared/errors/getError';
import {
  PERPS_SCREEN,
  type PerpsPositionActionFormParams,
} from 'src/shared/types/perps-events';
import { emitter } from 'src/ui/shared/events';
import { useBackgroundKind } from 'src/ui/components/Background';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { PageBottom } from 'src/ui/components/PageBottom';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { HoldableButton } from 'src/ui/pages/SwapForm2/SwapButton/HoldableButton';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import { VStack } from 'src/ui/ui-kit/VStack';
import { WalletAvatar } from 'src/ui/components/WalletAvatar';
import { TradeNavTitle } from './TradeNavTitle';
import { OpenPositionForm } from './OpenPositionForm';
import { AddToPositionForm } from './AddToPositionForm';
import { ClosePositionForm } from './ClosePositionForm';
import { LeverageOverlay } from './LeverageOverlay';
import { AutoCloseOverlay } from './AutoCloseOverlay';
import { usePerpsTradingContext } from './usePerpsTradingContext';
import { useTradeFormState } from './useTradeFormState';
import * as s from './styles.module.css';

const DEFAULT_LEVERAGE = 5;

function SubmitFooter({
  label,
  disabled,
  onSubmit,
}: {
  label: string;
  disabled: boolean;
  onSubmit: () => void;
}) {
  return (
    <div className={s.absoluteFooter}>
      <Spacer height={16} />
      <HoldableButton label={label} disabled={disabled} onFire={onSubmit} />
      <PageBottom />
    </div>
  );
}

export function PerpsTrade() {
  useBackgroundKind({ kind: 'white' });
  const { perp_id: perpId } = useParams();
  invariant(perpId, 'perp_id is required');
  const parsed = useMemo(() => parsePerpId(perpId), [perpId]);
  const displayName = getPerpDisplayName(parsed.coin);

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { singleAddress: address } = useAddressParams();

  const { state, updateState, clearForm } = useTradeFormState();
  const [leverageOpen, setLeverageOpen] = useState(false);
  const [autoCloseOpen, setAutoCloseOpen] = useState(false);

  const ctxRefetchInterval = useHyperliquidRefetchInterval(10_000);
  const { data: ctxData } = useMetaAndAssetCtxs(
    { dexIdentifier: parsed.dexIdentifier },
    { refetchInterval: ctxRefetchInterval }
  );
  const asset = useMemo(
    () => findPerpAsset(ctxData, parsed.coin),
    [ctxData, parsed.coin]
  );

  // For builder-DEX assets the exchange API expects a derived asset id:
  // 100_000 + dexIndex * 10_000 + localIndex, where dexIndex is the raw
  // position in `usePerpDexs` (which returns [undefined, "xyz", ...]).
  // Slot 0 is the main DEX and uses the raw asset index instead.
  const { data: dexList } = usePerpDexs();
  const builderDexIndex = useMemo(() => {
    if (!parsed.dexIdentifier || !dexList) return undefined;
    const idx = dexList.indexOf(parsed.dexIdentifier);
    return idx > 0 ? idx : undefined;
  }, [dexList, parsed.dexIdentifier]);

  const { data: clearingState } = useClearinghouseState(
    { address, dexIdentifier: parsed.dexIdentifier },
    { enabled: Boolean(address) }
  );

  const position = useMemo(() => {
    if (!clearingState) return null;
    const entry = clearingState.assetPositions.find(
      (e) => e.position.coin.toLowerCase() === parsed.coin.toLowerCase()
    );
    return entry?.position ?? null;
  }, [clearingState, parsed.coin]);

  const tradingContext = usePerpsTradingContext({ address });

  const markPrice = asset ? Number(asset.ctx.markPx) : 0;

  // Mode-aware available-balance: in unified / portfolio-margin modes per-perp-account
  // `withdrawable` returns 0 even when the user has spendable USDC in the
  // unified spot account. For unified users we promote `effectiveWithdrawableUSDC`
  // from "fallback while activeAssetData is in flight" to a real
  // `max(activeAssetData, effective)` floor — otherwise a unified user with
  // funds on the spot side sees 0 available to trade. For legacy users we
  // trust `activeAssetData.availableToTrade` once it lands.
  const { effectiveWithdrawableUSDC, isUnified } = useHyperliquidAccountSummary(
    { address }
  );
  const activeAssetDataRefetchInterval = useHyperliquidRefetchInterval(10_000);
  const { data: activeAssetData } = usePerpActiveAssetData(
    { address, coin: parsed.coin },
    { refetchInterval: activeAssetDataRefetchInterval }
  );
  const availableToTrade: [number, number] = (() => {
    if (!activeAssetData) {
      return [effectiveWithdrawableUSDC, effectiveWithdrawableUSDC];
    }
    const long = Number(activeAssetData.availableToTrade[0]);
    const short = Number(activeAssetData.availableToTrade[1]);
    if (!isUnified) return [long, short];
    return [
      Math.max(long, effectiveWithdrawableUSDC),
      Math.max(short, effectiveWithdrawableUSDC),
    ];
  })();

  // Stale-URL recovery: if ?mode=close / ?mode=add but no open position, drop
  // the form params so the user lands on a clean default-mode form instead of
  // a broken state.
  useEffect(() => {
    if (!clearingState) return; // wait for resolved data
    if ((state.mode === 'close' || state.mode === 'add') && !position) {
      clearForm({ replace: true });
    }
  }, [state.mode, position, clearingState, clearForm]);

  // Default leverage if the user hasn't picked one yet.
  useEffect(() => {
    if (state.leverage != null) return;
    if (state.mode !== 'open' && state.mode !== null) return;
    if (!asset) return;
    const defaultLev = Math.min(DEFAULT_LEVERAGE, asset.universe.maxLeverage);
    updateState({ leverage: defaultLev }, { replace: true });
  }, [state.leverage, state.mode, asset, updateState]);

  // Default mode: open when no position, otherwise let user pick via PerpPage CTAs.
  const effectiveMode = state.mode ?? 'open';
  const effectiveSide =
    state.side ?? (position && Number(position.szi) < 0 ? 'short' : 'long');
  const effectiveLeverage = state.leverage ?? DEFAULT_LEVERAGE;

  const submitMutation = useMutation({
    mutationFn: async () => {
      invariant(address, 'Wallet address is required');
      invariant(asset, 'Asset data not loaded');
      invariant(tradingContext.isReady, 'Trading context not ready');

      // JIT verification: refresh ctxs right before we serialize the order so
      // the price/size we sign reflects current state. Keyed `[name, payload]`
      // where payload is `{dexIdentifier}`, so partial-match needs the predicate
      // form — scope to the DEX we're about to trade on, not all DEXes.
      await queryClient.invalidateQueries({
        predicate: (q) => {
          const [name, payload] = q.queryKey as [
            string,
            { dexIdentifier?: string } | undefined
          ];
          return (
            name === 'hyperliquid/metaAndAssetCtxs' &&
            payload?.dexIdentifier === parsed.dexIdentifier
          );
        },
      });

      const assetId = computeAssetId({
        index: asset.index,
        dexIndex: builderDexIndex,
      });

      // Margin-type rule: Hyperliquid rejects flipping cross/isolated while a
      // position is open. If a position already exists on this coin (e.g. user
      // is "opening" another long on top of an existing one, or `add`/`close`),
      // we MUST match the existing margin type. Greenfield opens default to
      // cross.
      const existingIsCross =
        position != null ? position.leverage.type === 'cross' : true;

      let intent: PerpsIntent;
      let analytics: PerpsPositionActionFormParams;

      if (effectiveMode === 'open') {
        invariant(state.inputAmount, 'Amount is required');
        const marginUsd = Number(state.inputAmount);
        const size = calculatePositionSize({
          margin: marginUsd,
          leverage: effectiveLeverage,
          entryPrice: markPrice,
          szDecimals: asset.universe.szDecimals,
        });
        const limitPx = calculatePriceWithSlippage({
          basePrice: markPrice,
          isLong: effectiveSide === 'long',
          szDecimals: asset.universe.szDecimals,
        });
        const isLong = effectiveSide === 'long';
        const mainOrder: ExchangePlaceOrderPayload = {
          a: assetId,
          b: isLong,
          p: String(limitPx),
          s: String(size),
          r: false,
          t: buildIocLimitOrderType(),
        };

        const orders: ExchangePlaceOrderPayload[] = [mainOrder];
        if (state.takeProfitPrice) {
          const tpPx = formatOrderPrice(
            Number(state.takeProfitPrice),
            asset.universe.szDecimals
          );
          orders.push({
            a: assetId,
            b: !isLong,
            p: String(tpPx),
            s: String(formatOrderSize(size, asset.universe.szDecimals)),
            r: true,
            t: buildTriggerOrderType({
              triggerPx: String(tpPx),
              isMarket: true,
              tpsl: 'tp',
            }),
          });
        }
        if (state.stopLossPrice) {
          const slPx = formatOrderPrice(
            Number(state.stopLossPrice),
            asset.universe.szDecimals
          );
          orders.push({
            a: assetId,
            b: !isLong,
            p: String(slPx),
            s: String(formatOrderSize(size, asset.universe.szDecimals)),
            r: true,
            t: buildTriggerOrderType({
              triggerPx: String(slPx),
              isMarket: true,
              tpsl: 'sl',
            }),
          });
        }

        const grouping = orders.length > 1 ? 'normalTpsl' : 'na';
        const action = buildOrderAction({
          orders,
          grouping,
          builder: {
            b: tradingContext.builderAddress,
            f: tradingContext.builderFeeUnits,
          },
        });

        intent = {
          kind: 'open',
          coin: parsed.coin,
          dexIdentifier: parsed.dexIdentifier,
          asset: assetId,
          isCross: existingIsCross,
          desiredLeverage: effectiveLeverage,
          order: action,
          successText: 'Position opened',
        };

        const notional = size * markPrice;
        const floatSide = isLong ? 1 : -1;
        const liqPrice =
          size > 0
            ? calculateIsolatedLiquidationPrice({
                mid: markPrice,
                floatSide,
                leverage: { value: effectiveLeverage, rawUsd: 0 },
                positionSzi: 0,
                userSz: size,
                totalNtlPos: notional,
                updatedPosition: floatSide * size,
                maxLeverage: asset.universe.maxLeverage,
              })
            : null;
        const takeProfitUsd = Number(state.takeProfitPrice);
        const stopLossUsd = Number(state.stopLossPrice);
        analytics = {
          position_side: isLong ? 'Long' : 'Short',
          action_type: 'Open',
          amount_usd: marginUsd,
          asset_name: asset.universe.name,
          leverage: effectiveLeverage,
          zerion_fee_percentage: tradingContext.zerionRate * 100,
          zerion_fee_usd_amount: notional * tradingContext.zerionRate,
          provider_fee_percentage: tradingContext.hyperliquidRate * 100,
          provider_fee_usd_amount: notional * tradingContext.hyperliquidRate,
          entry_price_usd: markPrice,
          liquidation_price_usd: liqPrice ?? 0,
          size: notional,
          margin: marginUsd,
          delta_size: notional,
          delta_margin: marginUsd,
          screen_name: isLong ? PERPS_SCREEN.Long : PERPS_SCREEN.Short,
          take_profit_usd: takeProfitUsd > 0 ? takeProfitUsd : undefined,
          stop_loss_usd: stopLossUsd > 0 ? stopLossUsd : undefined,
        };
      } else if (effectiveMode === 'add') {
        invariant(position, 'Position is required for add');
        invariant(state.inputAmount, 'Amount is required');
        const positionLeverage = position.leverage.value;
        const marginUsd = Number(state.inputAmount);
        const size = calculatePositionSize({
          margin: marginUsd,
          leverage: positionLeverage,
          entryPrice: markPrice,
          szDecimals: asset.universe.szDecimals,
        });
        const isLong = Number(position.szi) >= 0;
        const limitPx = calculatePriceWithSlippage({
          basePrice: markPrice,
          isLong,
          szDecimals: asset.universe.szDecimals,
        });
        const action = buildOrderAction({
          orders: [
            {
              a: assetId,
              b: isLong,
              p: String(limitPx),
              s: String(size),
              r: false,
              t: buildIocLimitOrderType(),
            },
          ],
          grouping: 'na',
          builder: {
            b: tradingContext.builderAddress,
            f: tradingContext.builderFeeUnits,
          },
        });
        intent = {
          kind: 'add',
          coin: parsed.coin,
          dexIdentifier: parsed.dexIdentifier,
          asset: assetId,
          isCross: existingIsCross,
          desiredLeverage: positionLeverage,
          order: action,
          successText: 'Position updated',
        };

        const notional = size * markPrice;
        const existingSize = Math.abs(Number(position.positionValue));
        const existingMargin = Number(position.marginUsed);
        analytics = {
          position_side: isLong ? 'Long' : 'Short',
          action_type: 'Add',
          amount_usd: marginUsd,
          asset_name: asset.universe.name,
          leverage: positionLeverage,
          zerion_fee_percentage: tradingContext.zerionRate * 100,
          zerion_fee_usd_amount: notional * tradingContext.zerionRate,
          provider_fee_percentage: tradingContext.hyperliquidRate * 100,
          provider_fee_usd_amount: notional * tradingContext.hyperliquidRate,
          entry_price_usd: Number(position.entryPx),
          liquidation_price_usd: position.liquidationPx
            ? Number(position.liquidationPx)
            : 0,
          size: existingSize + notional,
          margin: existingMargin + marginUsd,
          delta_size: notional,
          delta_margin: marginUsd,
          screen_name: isLong
            ? PERPS_SCREEN.AddToLong
            : PERPS_SCREEN.AddToShort,
        };
      } else if (effectiveMode === 'close') {
        invariant(position, 'Position is required for close');
        invariant(state.inputAmount, 'Amount is required');
        const positionAbsSize = Math.abs(Number(position.szi));
        const positionValueAbs = Math.abs(Number(position.positionValue));
        const closeUsd = Number(state.inputAmount);
        const closeFraction =
          positionValueAbs > 0 ? Math.min(closeUsd / positionValueAbs, 1) : 0;
        const rawSize = positionAbsSize * closeFraction;
        const size = formatOrderSize(rawSize, asset.universe.szDecimals);
        const isLong = Number(position.szi) >= 0;
        // Closing means the opposite side: longs sell, shorts buy.
        const limitPx = calculatePriceWithSlippage({
          basePrice: markPrice,
          isLong: !isLong,
          szDecimals: asset.universe.szDecimals,
        });
        const action = buildOrderAction({
          orders: [
            {
              a: assetId,
              b: !isLong,
              p: String(limitPx),
              s: String(size),
              r: true,
              t: buildIocLimitOrderType(),
            },
          ],
          grouping: 'na',
          builder: {
            b: tradingContext.builderAddress,
            f: tradingContext.builderFeeUnits,
          },
        });
        intent = {
          kind: 'close',
          coin: parsed.coin,
          dexIdentifier: parsed.dexIdentifier,
          asset: assetId,
          isCross: existingIsCross,
          desiredLeverage: position.leverage.value,
          order: action,
          successText:
            closeFraction >= 1 ? 'Position closed' : 'Position updated',
        };

        const marginUsed = Number(position.marginUsed);
        const marginBeingClosed = marginUsed * closeFraction;
        const sizeBeingClosed = size * markPrice;
        const totalPositionSize = positionAbsSize * markPrice;
        const unrealizedPnl = Number(position.unrealizedPnl);
        const scaledPnlRaw = unrealizedPnl * closeFraction;
        // Snap to 0 to avoid misleading "-$0.00" residue from tiny floating-point math.
        const scaledPnl = Math.abs(scaledPnlRaw) < 0.005 ? 0 : scaledPnlRaw;
        analytics = {
          position_side: isLong ? 'Long' : 'Short',
          action_type: 'Close',
          amount_usd: marginBeingClosed,
          asset_name: asset.universe.name,
          leverage: position.leverage.value,
          zerion_fee_percentage: tradingContext.zerionRate * 100,
          zerion_fee_usd_amount: sizeBeingClosed * tradingContext.zerionRate,
          provider_fee_percentage: tradingContext.hyperliquidRate * 100,
          provider_fee_usd_amount:
            sizeBeingClosed * tradingContext.hyperliquidRate,
          entry_price_usd: Number(position.entryPx),
          liquidation_price_usd: position.liquidationPx
            ? Number(position.liquidationPx)
            : undefined,
          size: totalPositionSize - sizeBeingClosed,
          margin: marginUsed - marginBeingClosed,
          delta_size: -sizeBeingClosed,
          delta_margin: -marginBeingClosed,
          screen_name: isLong
            ? PERPS_SCREEN.CloseLong
            : PERPS_SCREEN.CloseShort,
          receive_usd_amount: marginBeingClosed + scaledPnl,
          realized_pnl_usd: scaledPnl,
        };
      } else {
        return;
      }

      try {
        await runPerpsIntent({
          intent,
          context: {
            address,
            builder: tradingContext.builderAddress,
            requiredMaxBuilderFee: tradingContext.maxApproveBuilderFeeUnits,
            referralCode: tradingContext.referralCode,
          },
        });
        emitter.emit('perpsPositionAction', {
          ...analytics,
          success_status: true,
        });
      } catch (error) {
        emitter.emit('perpsPositionAction', {
          ...analytics,
          success_status: false,
          backend_error_message: getError(error).message,
        });
        throw error;
      }
    },
    onSuccess: () => {
      markHyperliquidOpSubmitted();
      // Scope each invalidation to (this address, this DEX, this coin) so we
      // don't refetch every cached DEX variant. `clearinghouseState` is keyed
      // flat `[name, address, dexIdentifier]` (shared by `useClearinghouseState`
      // and `useClearinghouseStates`, the overview list); `metaAndAssetCtxs`
      // and `userFills` are keyed `[name, payload]` so they need object-shape
      // predicate-matching; `activeAssetData` and `spotClearinghouseState` use
      // flat keys and can use the array form.
      queryClient.invalidateQueries({
        predicate: (q) => {
          const [name, keyAddress, keyDex] = q.queryKey as [
            string,
            string | null | undefined,
            string | undefined
          ];
          return (
            name === 'hyperliquid/clearinghouseState' &&
            keyAddress === address &&
            keyDex === parsed.dexIdentifier
          );
        },
      });
      queryClient.invalidateQueries({
        queryKey: ['hyperliquid/activeAssetData', address, parsed.coin],
      });
      queryClient.invalidateQueries({
        queryKey: ['hyperliquid/spotClearinghouseState', address],
      });
      queryClient.invalidateQueries({
        predicate: (q) => {
          const [name, payload] = q.queryKey as [
            string,
            { address?: string } | undefined
          ];
          return (
            name === 'hyperliquid/userFills' && payload?.address === address
          );
        },
      });
    },
  });

  function handleSubmit() {
    submitMutation.mutate();
    // Navigate back immediately — the orchestrator runs in the background and
    // surfaces progress via the perps activity toaster.
    navigate(-1);
  }

  const inputValid = Number(state.inputAmount) > 0;

  let submitLabel = 'Place order';
  if (effectiveMode === 'open') {
    submitLabel = effectiveSide === 'long' ? 'Buy Long' : 'Buy Short';
  } else if (effectiveMode === 'add') {
    const isLong = position ? Number(position.szi) >= 0 : true;
    submitLabel = isLong ? 'Add to Long' : 'Add to Short';
  } else if (effectiveMode === 'close') {
    submitLabel = 'Close position';
  }

  // Close-mode validation (block sub-$10 remainder).
  let closeBlocker = false;
  if (effectiveMode === 'close' && position) {
    const positionValueAbs = Math.abs(Number(position.positionValue));
    const closeUsd = Number(state.inputAmount) || 0;
    const remainingUsd = Math.max(positionValueAbs - closeUsd, 0);
    if (remainingUsd > 0 && remainingUsd < MIN_ORDER_NOTIONAL_USD)
      closeBlocker = true;
    if (closeUsd > positionValueAbs) closeBlocker = true;
  }

  // Open/Add validation: after szDecimals rounding the lot-quantised notional
  // can land below Hyperliquid's $10 minimum (worst case: low-precision,
  // high-priced assets like SP500 where each lot is ~$7.50 at 1x). Compute the
  // *quantised* notional — not the raw user input — and block submit when it
  // would be rejected on-chain. This mirrors the iOS app's behaviour.
  let minNotionalBlocker = false;
  if (
    asset &&
    inputValid &&
    (effectiveMode === 'open' || effectiveMode === 'add')
  ) {
    const marginUsd = Number(state.inputAmount);
    const leverage =
      effectiveMode === 'add' && position
        ? position.leverage.value
        : effectiveLeverage;
    const plannedSize = calculatePositionSize({
      margin: marginUsd,
      leverage,
      entryPrice: markPrice,
      szDecimals: asset.universe.szDecimals,
    });
    const plannedNotional = plannedSize * markPrice;
    if (plannedNotional > 0 && plannedNotional < MIN_ORDER_NOTIONAL_USD) {
      minNotionalBlocker = true;
    }
  }

  // For builder-DEX assets the assetId depends on the dex's position in the
  // perpDexs list; block submit until the list has resolved so we don't fall
  // back to the raw asset index and place an order against the wrong market.
  const dexIndexMissing =
    parsed.dexIdentifier != null && builderDexIndex == null;

  const submitDisabled =
    !tradingContext.isReady ||
    !inputValid ||
    closeBlocker ||
    minNotionalBlocker ||
    dexIndexMissing ||
    submitMutation.isLoading;

  return (
    <PageColumn>
      <NavigationTitle
        title={
          <TradeNavTitle
            coin={parsed.coin}
            displayName={displayName}
            mode={state.mode}
            side={effectiveSide}
            positionIsLong={position ? Number(position.szi) >= 0 : null}
            markPrice={markPrice}
          />
        }
        documentTitle={`Trade ${displayName} Perps`}
        elementEnd={
          address ? (
            <UnstyledLink
              style={{ placeSelf: 'center end', marginRight: 16 - 8 }}
              to="/wallet-select"
              title="Change Wallet"
            >
              <WalletAvatar
                active={false}
                address={address}
                size={24}
                borderRadius={6}
              />
            </UnstyledLink>
          ) : undefined
        }
      />
      <PageTop />
      <VStack gap={16} style={{ paddingBottom: 96 }}>
        {asset && effectiveMode === 'open' ? (
          <OpenPositionForm
            asset={asset}
            markPrice={markPrice}
            availableToTrade={
              availableToTrade[effectiveSide === 'short' ? 1 : 0]
            }
            formState={{
              ...state,
              side: effectiveSide,
              leverage: effectiveLeverage,
            }}
            onChange={updateState}
            onOpenLeverage={() => setLeverageOpen(true)}
            onOpenAutoClose={() => setAutoCloseOpen(true)}
            totalFeeRate={tradingContext.totalRate}
          />
        ) : null}

        {asset && position && effectiveMode === 'add' ? (
          <AddToPositionForm
            asset={asset}
            position={position}
            markPrice={markPrice}
            availableToTrade={
              availableToTrade[Number(position.szi) < 0 ? 1 : 0]
            }
            formState={state}
            onChange={updateState}
            totalFeeRate={tradingContext.totalRate}
          />
        ) : null}

        {asset && position && effectiveMode === 'close' ? (
          <ClosePositionForm
            asset={asset}
            position={position}
            markPrice={markPrice}
            formState={state}
            onChange={updateState}
            totalFeeRate={tradingContext.totalRate}
          />
        ) : null}
      </VStack>

      <SubmitFooter
        label={submitLabel}
        disabled={submitDisabled}
        onSubmit={handleSubmit}
      />

      {asset ? (
        <LeverageOverlay
          open={leverageOpen}
          initialLeverage={effectiveLeverage}
          maxLeverage={asset.universe.maxLeverage}
          onConfirm={(lev) => updateState({ leverage: lev })}
          onClose={() => setLeverageOpen(false)}
        />
      ) : null}

      {asset ? (
        <AutoCloseOverlay
          open={autoCloseOpen}
          initial={{
            takeProfitPrice: state.takeProfitPrice,
            stopLossPrice: state.stopLossPrice,
          }}
          entryPrice={markPrice}
          side={effectiveSide}
          leverage={effectiveLeverage}
          onConfirm={(values) =>
            updateState({
              takeProfitPrice: values.takeProfitPrice,
              stopLossPrice: values.stopLossPrice,
            })
          }
          onClose={() => setAutoCloseOpen(false)}
        />
      ) : null}
    </PageColumn>
  );
}

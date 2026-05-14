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
import { useBackgroundKind } from 'src/ui/components/Background';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { PageBottom } from 'src/ui/components/PageBottom';
import { PageStickyFooter } from 'src/ui/components/PageStickyFooter';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { Button } from 'src/ui/ui-kit/Button';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { VStack } from 'src/ui/ui-kit/VStack';
import { Toolbar } from '../Blocks/Toolbar';
import { OpenPositionForm } from './OpenPositionForm';
import { AddToPositionForm } from './AddToPositionForm';
import { ClosePositionForm } from './ClosePositionForm';
import { LeverageOverlay } from './LeverageOverlay';
import { AutoCloseOverlay } from './AutoCloseOverlay';
import { usePerpsTradingContext } from './usePerpsTradingContext';
import { useTradeFormState } from './useTradeFormState';

const DEFAULT_LEVERAGE = 5;

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

  const { data: ctxData } = useMetaAndAssetCtxs(
    { dexIdentifier: parsed.dexIdentifier },
    { refetchInterval: 5000 }
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
  const { data: activeAssetData } = usePerpActiveAssetData(
    { address, coin: parsed.coin },
    { refetchInterval: 10_000 }
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
      // the price/size we sign reflects current state.
      await queryClient.invalidateQueries({
        queryKey: ['hyperliquid/metaAndAssetCtxs', parsed.dexIdentifier],
      });

      const assetId = computeAssetId({
        index: asset.index,
        dexIndex: builderDexIndex,
      });

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

        await runPerpsIntent({
          intent: {
            kind: 'open',
            coin: parsed.coin,
            asset: assetId,
            isCross: true,
            desiredLeverage: effectiveLeverage,
            order: action,
            successText: 'Position opened',
          },
          context: {
            address,
            builder: tradingContext.builderAddress,
            requiredMaxBuilderFee: tradingContext.builderFeeUnits,
            referralCode: tradingContext.referralCode,
          },
        });
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
        await runPerpsIntent({
          intent: {
            kind: 'add',
            coin: parsed.coin,
            asset: assetId,
            isCross: true,
            desiredLeverage: positionLeverage,
            order: action,
            successText: 'Position updated',
          },
          context: {
            address,
            builder: tradingContext.builderAddress,
            requiredMaxBuilderFee: tradingContext.builderFeeUnits,
            referralCode: tradingContext.referralCode,
          },
        });
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
        await runPerpsIntent({
          intent: {
            kind: 'close',
            coin: parsed.coin,
            asset: assetId,
            isCross: true,
            desiredLeverage: position.leverage.value,
            order: action,
            successText:
              closeFraction >= 1 ? 'Position closed' : 'Position updated',
          },
          context: {
            address,
            builder: tradingContext.builderAddress,
            requiredMaxBuilderFee: tradingContext.builderFeeUnits,
            referralCode: tradingContext.referralCode,
          },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['hyperliquid/clearinghouseState'],
      });
      queryClient.invalidateQueries({
        queryKey: ['hyperliquid/activeAssetData'],
      });
      queryClient.invalidateQueries({
        queryKey: ['hyperliquid/spotClearinghouseState'],
      });
      queryClient.invalidateQueries({ queryKey: ['hyperliquid/userFills'] });
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

  // For builder-DEX assets the assetId depends on the dex's position in the
  // perpDexs list; block submit until the list has resolved so we don't fall
  // back to the raw asset index and place an order against the wrong market.
  const dexIndexMissing =
    parsed.dexIdentifier != null && builderDexIndex == null;

  const submitDisabled =
    !tradingContext.isReady ||
    !inputValid ||
    closeBlocker ||
    dexIndexMissing ||
    submitMutation.isLoading;

  return (
    <PageColumn>
      <NavigationTitle
        title={
          <Toolbar
            coin={parsed.coin}
            displayName={displayName}
            style={{ paddingLeft: 8 }}
          />
        }
        documentTitle={`Trade ${displayName} Perps`}
      />
      <PageTop />
      <VStack gap={16}>
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

      <Spacer height={24} />
      <PageStickyFooter>
        <Spacer height={16} />
        <Button
          kind="primary"
          size={48}
          onClick={handleSubmit}
          disabled={submitDisabled}
        >
          {submitLabel}
        </Button>
        <PageBottom />
      </PageStickyFooter>

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

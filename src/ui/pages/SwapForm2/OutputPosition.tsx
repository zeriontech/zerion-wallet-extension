import React, { useId } from 'react';
import { Tooltip, TooltipAnchor, TooltipProvider } from 'src/ui/ui-kit/Tooltip';
import { isMacOS } from 'src/ui/shared/isMacos';
import { KeyboardShortcut } from 'src/ui/components/KeyboardShortcut';
import { UIText } from 'src/ui/ui-kit/UIText';
import type { FungiblePosition } from 'src/modules/zerion-api/requests/wallet-get-simple-positions';
import { HStack } from 'src/ui/ui-kit/HStack';
import { BlurrableBalance } from 'src/ui/components/BlurrableBalance';
import { formatTokenValue } from 'src/shared/units/formatTokenValue';
import BigNumber from 'bignumber.js';
import { formatCurrencyValue } from 'src/shared/units/formatCurrencyValue';
import { useCurrency } from 'src/modules/currency/useCurrency';
import type { Networks } from 'src/modules/networks/Networks';
import { useDialog2 } from 'src/ui/ui-kit/ModalDialogs/Dialog2';
import { formatPercent } from 'src/shared/units/formatPercent';
import type { InputKind } from 'src/ui/components/AmountInput/inputKind';
import { getCurrencySymbol } from 'src/ui/components/AmountInput/getCurrencySymbol';
import {
  roundCurrencyDisplayValue,
  roundTokenDisplayValue,
} from 'src/ui/components/AmountInput/roundDisplayValue';
import {
  CurrencySymbolOverlay,
  HiddenMirror,
  useMeasure,
  useValueScaling,
} from 'src/ui/components/AmountInput/ValueWithSymbol';
import {
  getPriceImpactPercentage,
  type PriceImpact,
} from '../SwapForm/shared/price-impact';
import { FormFieldset } from './FormFieldset';
import { AssetSelectorButton } from './AssetSelectorButton';
import * as assetSelectorStyles from './AssetSelectorButton.module.css';
import * as styles from './styles.module.css';
import { OutputPositionSelector } from './PositionSelector/OutputPositionSelector';

function OutputDescription({
  outputAmount,
  position,
  priceImpact,
  inputKind,
}: {
  outputAmount: string | null;
  position: FungiblePosition | null;
  priceImpact: PriceImpact | null;
  inputKind: InputKind;
}) {
  const { currency } = useCurrency();

  if (
    outputAmount == null ||
    outputAmount === '' ||
    Number(outputAmount) === 0
  ) {
    return null;
  }

  const isNoPriceData = priceImpact?.kind === 'n/a';
  const isProfit = priceImpact?.kind === 'profit';
  const isLossWarning =
    priceImpact?.kind === 'loss' &&
    (priceImpact.level === 'medium' || priceImpact.level === 'high');

  const color =
    isLossWarning || isNoPriceData
      ? 'var(--negative-500)'
      : isProfit
      ? 'var(--positive-500)'
      : 'var(--neutral-600)';

  const price = position?.fungible.meta.price;
  const fiatValue =
    price != null ? new BigNumber(outputAmount).times(price) : null;

  const priceImpactPercentage =
    priceImpact && (isLossWarning || isProfit)
      ? getPriceImpactPercentage(priceImpact)
      : null;

  const primaryText =
    inputKind === 'currency'
      ? `~${roundTokenDisplayValue(outputAmount) ?? ''}`
      : fiatValue
      ? `~${formatCurrencyValue(fiatValue, 'en', currency)}`
      : null;

  return (
    <HStack gap={4}>
      <UIText kind="small/regular" color={color}>
        {primaryText}
      </UIText>
      {priceImpactPercentage != null ? (
        <UIText kind="small/regular" color={color}>
          {`(${priceImpactPercentage > 0 ? '+' : ''}${formatPercent(
            priceImpactPercentage,
            'en'
          )}%)`}
        </UIText>
      ) : null}
    </HStack>
  );
}

function AssetSelectorSkeleton() {
  return (
    <HStack gap={8} alignItems="center">
      <div
        className={styles.skeletonCircle}
        style={{ width: 32, height: 32 }}
      />
      <div className={styles.skeleton} style={{ width: 72, height: 24 }} />
    </HStack>
  );
}

export function OutputPosition({
  onSelectFungible,
  position,
  outputAmount,
  positions,
  receiverPositions,
  networks,
  priceImpact,
  inputChainId,
  outputChainId,
  inputKind,
  defaultPending,
}: {
  onSelectFungible: (chainId: string, fungibleId: string) => void;
  position: FungiblePosition | null;
  outputAmount: string | null;
  positions: FungiblePosition[];
  receiverPositions: FungiblePosition[];
  networks: Networks;
  priceImpact: PriceImpact | null;
  inputChainId: string | null;
  outputChainId: string | null;
  inputKind: InputKind;
  defaultPending: boolean;
}) {
  const inputId = useId();
  const selectorDialog = useDialog2();
  const positionBalance = position?.amount.quantity ?? null;
  const { currency } = useCurrency();
  const currencySymbol = getCurrencySymbol(currency);
  const outputPrice = position?.fungible.meta.price ?? null;

  const displayValue = (() => {
    if (outputAmount == null) return '0';
    if (inputKind === 'currency') {
      const fiat =
        outputPrice != null
          ? new BigNumber(outputAmount).times(outputPrice).toFixed()
          : null;
      return roundCurrencyDisplayValue(fiat) ?? '0';
    }
    return roundTokenDisplayValue(outputAmount) ?? '0';
  })();

  const [containerRef, { width: containerWidth }] =
    useMeasure<HTMLDivElement>();
  const { defaultMirrorRef, shrunkMirrorRef, textWidth, activeKind } =
    useValueScaling({
      text: displayValue,
      containerWidth,
    });

  return (
    <>
      <FormFieldset
        inputId={inputId}
        startTitle={<UIText kind="small/regular">Receive</UIText>}
        endTitle={<div />}
        startContent={
          defaultPending ? (
            <AssetSelectorSkeleton />
          ) : (
            <TooltipProvider placement="top" timeout={1000}>
              <TooltipAnchor
                render={
                  <AssetSelectorButton
                    position={position}
                    onClick={selectorDialog.openDialog}
                  />
                }
              />
              <Tooltip
                className={assetSelectorStyles.tooltip}
                gutter={8}
                portal={false}
              >
                <UIText kind="caption/regular">
                  <span>Select Asset to Receive</span>{' '}
                  <span className={assetSelectorStyles.tooltipKbd}>
                    {isMacOS() ? '⇧↓' : 'Shift+↓'}
                  </span>
                </UIText>
              </Tooltip>
            </TooltipProvider>
          )
        }
        endContent={
          <UIText kind={activeKind}>
            <div
              ref={containerRef}
              style={{
                position: 'relative',
                width: '100%',
                color: outputAmount != null ? undefined : 'var(--neutral-400)',
              }}
            >
              <HiddenMirror mirrorRef={defaultMirrorRef} kind="headline/h3">
                {displayValue}
              </HiddenMirror>
              <HiddenMirror mirrorRef={shrunkMirrorRef} kind="caption/accent">
                {displayValue}
              </HiddenMirror>
              <div style={{ textAlign: 'end' }}>{displayValue}</div>
              <CurrencySymbolOverlay
                currencySymbol={
                  inputKind === 'currency' ? currencySymbol : null
                }
                textWidth={textWidth}
              />
            </div>
          </UIText>
        }
        startDescription={
          <HStack gap={4} alignItems="center">
            <span>Balance:</span>
            <BlurrableBalance kind="small/regular">
              {positionBalance ? formatTokenValue(positionBalance) : null}
            </BlurrableBalance>
          </HStack>
        }
        endDescription={
          <OutputDescription
            outputAmount={outputAmount}
            position={position}
            priceImpact={priceImpact}
            inputKind={inputKind}
          />
        }
      />
      <KeyboardShortcut
        combination="shift+down"
        availableDuringInputs={true}
        disabled={selectorDialog.open}
        onKeyDown={selectorDialog.openDialog}
      />
      <OutputPositionSelector
        open={selectorDialog.open}
        onClose={selectorDialog.closeDialog}
        positions={positions}
        receiverPositions={receiverPositions}
        networks={networks}
        inputChainId={inputChainId}
        outputChainId={outputChainId}
        onSelect={(fungible, chainId) => {
          onSelectFungible(chainId, fungible.id);
        }}
      />
    </>
  );
}

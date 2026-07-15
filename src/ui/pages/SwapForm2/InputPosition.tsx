import React, { useEffect, useId, useRef, useState } from 'react';
import { motion, useAnimationControls } from 'motion/react';
import { Tooltip, TooltipAnchor, TooltipProvider } from 'src/ui/ui-kit/Tooltip';
import { isMacOS } from 'src/ui/shared/isMacos';
import { KeyboardShortcut } from 'src/ui/components/KeyboardShortcut';
import { UIText } from 'src/ui/ui-kit/UIText';
import { DebouncedInput } from 'src/ui/ui-kit/Input/DebouncedInput';
import { UnstyledInput } from 'src/ui/ui-kit/UnstyledInput';
import { FLOAT_INPUT_PATTERN } from 'src/ui/shared/forms/inputs';
import { BlurrableBalance } from 'src/ui/components/BlurrableBalance';
import { formatTokenValue } from 'src/shared/units/formatTokenValue';
import type { FungiblePosition } from 'src/modules/zerion-api/requests/wallet-get-simple-positions';
import { formatCurrencyValue } from 'src/shared/units/formatCurrencyValue/formatCurrencyValue';
import { useCurrency } from 'src/modules/currency/useCurrency';
import BigNumber from 'bignumber.js';
import { useDialog2 } from 'src/ui/ui-kit/ModalDialogs/Dialog2';
import {
  QUICK_AMOUNTS,
  QuickAmountButton,
} from 'src/ui/shared/forms/QuickAmounts';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { createChain } from 'src/modules/networks/Chain';
import { HStack } from 'src/ui/ui-kit/HStack/HStack';
import { InputKindToggle } from 'src/ui/components/AmountInput/InputKindToggle';
import { getCurrencySymbol } from 'src/ui/components/AmountInput/getCurrencySymbol';
import { convertOnToggle } from 'src/ui/components/AmountInput/inputKind';
import { roundTokenDisplayValue } from 'src/ui/components/AmountInput/roundDisplayValue';
import {
  CurrencySymbolOverlay,
  HiddenMirror,
  useMeasure,
  useValueScaling,
} from 'src/ui/components/AmountInput/ValueWithSymbol';
import { FormFieldset } from './FormFieldset';
import type { HandleChangeFunction, SwapFormState2 } from './types';
import { AssetSelectorButton } from './AssetSelectorButton';
import * as assetSelectorStyles from './AssetSelectorButton.module.css';
import { InputPositionSelector } from './PositionSelector/InputPositionSelector';

const QUICK_AMOUNTS_NATIVE = [
  { title: '30%', factor: 0.3 },
  { title: '50%', factor: 0.5 },
  { title: '80%', factor: 0.8 },
];

function getPartialBalance(balance: string, factor: number): string {
  if (factor === 1) return new BigNumber(balance).toFixed();
  const value = new BigNumber(balance).multipliedBy(factor);
  return value.gt(100)
    ? value.dp(0, BigNumber.ROUND_DOWN).toFixed()
    : value.precision(3, BigNumber.ROUND_DOWN).toFixed();
}

export function InputPosition({
  formState,
  onChange,
  onSelectFungible,
  position,
  positions,
  resolvedInputAmount,
}: {
  formState: SwapFormState2;
  onChange: HandleChangeFunction;
  onSelectFungible: (chainId: string, fungibleId: string) => void;
  position: FungiblePosition | null;
  positions: FungiblePosition[];
  resolvedInputAmount: string | null;
}) {
  const { currency } = useCurrency();
  const { inputAmount } = formState;
  const inputKind = formState.inputKind ?? 'token';
  const inputRef = useRef<HTMLInputElement | null>(null);
  const inputId = useId();
  const selectorDialog = useDialog2();
  const [lastSelectedTab, setLastSelectedTab] = useState<string | null>(null);
  const { networks } = useNetworks();

  const positionBalance = position?.amount.quantity ?? null;
  const inputPrice = position?.fungible.meta.price ?? null;
  const tokenSymbol = position?.fungible.symbol ?? '';
  const currencySymbol = getCurrencySymbol(currency);

  // For native assets, drop MAX (which would zero out gas) and offer 80% instead.
  const isNative = (() => {
    if (!position || !networks) return false;
    const network = networks.getByNetworkId(createChain(position.chain.id));
    const nativeAddress = network?.native_asset?.id;
    if (!nativeAddress) return false;
    const implAddress = position.fungible.id;
    return implAddress === nativeAddress;
  })();
  const quickAmounts = isNative ? QUICK_AMOUNTS_NATIVE : QUICK_AMOUNTS;

  const notEnoughBalance =
    positionBalance !== null &&
    new BigNumber(resolvedInputAmount || '0').isGreaterThan(positionBalance);

  // Secondary line value: in token mode, currency equivalent; in currency mode, token equivalent.
  // When input price is unknown, omit the currency equivalent — showing $0.00 would be misleading.
  const secondaryNode =
    inputKind === 'token' ? (
      inputPrice != null ? (
        <UIText kind="small/regular">
          {formatCurrencyValue(
            new BigNumber(inputAmount || '0').times(inputPrice),
            'en',
            currency
          )}
        </UIText>
      ) : null
    ) : (
      <UIText kind="small/regular">
        {roundTokenDisplayValue(resolvedInputAmount) || '0'}
      </UIText>
    );

  const shakeControls = useAnimationControls();
  const prevNotEnoughBalanceRef = useRef(notEnoughBalance);
  useEffect(() => {
    if (!prevNotEnoughBalanceRef.current && notEnoughBalance) {
      shakeControls.start({
        x: [0, -4, 4, -3, 3, -2, 2, 0],
        transition: { duration: 0.4, ease: 'easeInOut' },
      });
    }
    prevNotEnoughBalanceRef.current = notEnoughBalance;
  }, [notEnoughBalance, shakeControls]);

  const showToggle = Boolean(inputPrice) && Boolean(tokenSymbol);

  const handleToggle = () => {
    const nextKind = inputKind === 'token' ? 'currency' : 'token';
    if (inputAmount) {
      const converted = convertOnToggle(
        inputAmount,
        inputKind,
        nextKind,
        inputPrice
      );
      onChange('inputAmount', converted);
    }
    onChange('inputKind', nextKind);
    inputRef.current?.focus();
  };

  const handleQuickAmount = (factor: number) => {
    if (!positionBalance) return;
    const tokenValue = getPartialBalance(positionBalance, factor);
    if (inputKind === 'currency' && inputPrice) {
      const currencyValue = new BigNumber(tokenValue)
        .multipliedBy(inputPrice)
        .decimalPlaces(2, BigNumber.ROUND_HALF_UP)
        .toFixed();
      onChange('inputAmount', currencyValue);
    } else {
      onChange('inputAmount', tokenValue);
    }
    inputRef.current?.focus();
  };

  // Track live input text (not debounced form state) so the symbol overlay
  // and font-shrink update in lockstep with the cursor.
  const [liveInput, setLiveInput] = useState<string>(inputAmount ?? '');
  useEffect(() => {
    setLiveInput(inputAmount ?? '');
  }, [inputAmount]);

  const [containerRef, { width: containerWidth }] =
    useMeasure<HTMLDivElement>();
  const { defaultMirrorRef, shrunkMirrorRef, textWidth, activeKind } =
    useValueScaling({
      text: liveInput || '0',
      containerWidth,
    });

  return (
    <>
      <FormFieldset
        inputId={inputId}
        startTitle={<UIText kind="small/regular">Pay with</UIText>}
        endTitle={
          positionBalance ? (
            <HStack gap={16} alignItems="center">
              {quickAmounts.map(({ factor, title }) => (
                <QuickAmountButton
                  key={factor}
                  onClick={() => handleQuickAmount(factor)}
                >
                  {title}
                </QuickAmountButton>
              ))}
              {showToggle ? (
                <InputKindToggle
                  inputKind={inputKind}
                  currencyCode={currency}
                  tokenSymbol={tokenSymbol}
                  onToggle={handleToggle}
                />
              ) : null}
            </HStack>
          ) : (
            <div />
          )
        }
        startContent={
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
                <span>Select Asset to Pay</span>{' '}
                <span className={assetSelectorStyles.tooltipKbd}>
                  {isMacOS() ? '⇧↑' : 'Shift+↑'}
                </span>
              </UIText>
            </Tooltip>
          </TooltipProvider>
        }
        endContent={
          <UIText kind={activeKind}>
            <div
              ref={containerRef}
              style={{
                position: 'relative',
                width: '100%',
              }}
            >
              <HiddenMirror mirrorRef={defaultMirrorRef} kind="headline/h3">
                {liveInput || '0'}
              </HiddenMirror>
              <HiddenMirror mirrorRef={shrunkMirrorRef} kind="caption/accent">
                {liveInput || '0'}
              </HiddenMirror>
              <DebouncedInput
                delay={300}
                value={inputAmount ?? ''}
                onChange={(value) => {
                  onChange('inputAmount', value);
                }}
                render={({ value, handleChange }) => (
                  <UnstyledInput
                    autoFocus={true}
                    id={inputId}
                    ref={inputRef}
                    style={{
                      textAlign: 'end',
                      textOverflow: 'ellipsis',
                      width: '100%',
                    }}
                    inputMode="decimal"
                    name="inputAmount"
                    value={value}
                    placeholder="0"
                    onChange={(event) => {
                      const next = event.currentTarget.value
                        .replace(',', '.')
                        .replace(/\s/g, '');
                      if (!/^\d*\.?\d*$/.test(next)) return;
                      setLiveInput(next);
                      handleChange(next);
                    }}
                    pattern={FLOAT_INPUT_PATTERN}
                    required={true}
                  />
                )}
              />
              <CurrencySymbolOverlay
                currencySymbol={
                  inputKind === 'currency' ? currencySymbol : null
                }
                textWidth={textWidth}
                color={liveInput ? 'var(--black)' : 'var(--neutral-600)'}
              />
            </div>
          </UIText>
        }
        startDescription={
          <motion.div
            animate={shakeControls}
            style={{
              color: notEnoughBalance
                ? 'var(--negative-500)'
                : 'var(--neutral-600)',
              display: 'flex',
              gap: 4,
            }}
          >
            <span>Balance:</span>
            <BlurrableBalance
              kind="small/regular"
              color={
                notEnoughBalance ? 'var(--negative-500)' : 'var(--neutral-600)'
              }
            >
              {positionBalance ? formatTokenValue(positionBalance) : null}
            </BlurrableBalance>
          </motion.div>
        }
        endDescription={secondaryNode}
      />
      <KeyboardShortcut
        combination="shift+up"
        availableDuringInputs={true}
        disabled={selectorDialog.open}
        onKeyDown={selectorDialog.openDialog}
      />
      <InputPositionSelector
        open={selectorDialog.open}
        onClose={selectorDialog.closeDialog}
        positions={positions}
        networks={networks}
        defaultSelectedTab={lastSelectedTab}
        onSelect={(chainId, fungibleId, selectedTab) => {
          onSelectFungible(chainId, fungibleId);
          setLastSelectedTab(selectedTab);
        }}
      />
    </>
  );
}

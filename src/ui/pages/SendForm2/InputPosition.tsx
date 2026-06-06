import React, { useEffect, useId, useRef, useState } from 'react';
import { motion, useAnimationControls } from 'motion/react';
import { Tooltip, TooltipAnchor, TooltipProvider } from 'src/ui/ui-kit/Tooltip';
import { isMacOS } from 'src/ui/shared/isMacos';
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
import {
  QUICK_AMOUNTS,
  QuickAmountButton,
} from 'src/ui/shared/forms/QuickAmounts';
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
import type { HandleChangeFunction, SendFormState2 } from './types';
import { AssetSelectorButton } from './AssetSelectorButton';
import * as assetSelectorStyles from './AssetSelectorButton.module.css';

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
  position,
  resolvedInputAmount,
  onOpenSelector,
}: {
  formState: SendFormState2;
  onChange: HandleChangeFunction;
  position: FungiblePosition | null;
  resolvedInputAmount: string | null;
  onOpenSelector: () => void;
}) {
  const { currency } = useCurrency();
  const { inputAmount } = formState;
  const inputKind = formState.inputKind ?? 'token';
  const inputRef = useRef<HTMLInputElement | null>(null);
  const inputId = useId();

  const positionBalance = position?.amount.quantity ?? null;
  const inputPrice = position?.fungible.meta.price ?? null;
  const tokenSymbol = position?.fungible.symbol ?? '';
  const currencySymbol = getCurrencySymbol(currency);

  const notEnoughBalance =
    positionBalance !== null &&
    new BigNumber(resolvedInputAmount || '0').isGreaterThan(positionBalance);

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
    <FormFieldset
      inputId={inputId}
      startTitle={<UIText kind="small/regular">Asset</UIText>}
      endTitle={
        positionBalance ? (
          <HStack gap={16} alignItems="center">
            {QUICK_AMOUNTS.map(({ factor, title }) => (
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
                onClick={onOpenSelector}
              />
            }
          />
          <Tooltip
            className={assetSelectorStyles.tooltip}
            gutter={8}
            portal={false}
          >
            <UIText kind="caption/regular">
              <span>Select Asset to Send</span>{' '}
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
            style={{ position: 'relative', width: '100%' }}
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
              currencySymbol={inputKind === 'currency' ? currencySymbol : null}
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
  );
}

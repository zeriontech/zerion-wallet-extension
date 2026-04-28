import React, { useEffect, useId, useRef } from 'react';
import { motion, useAnimationControls } from 'motion/react';
import { UIText } from 'src/ui/ui-kit/UIText';
import {
  DebouncedInput,
  type InputHandle,
} from 'src/ui/ui-kit/Input/DebouncedInput';
import { UnstyledInput } from 'src/ui/ui-kit/UnstyledInput';
import { FLOAT_INPUT_PATTERN } from 'src/ui/shared/forms/inputs';
import { BlurrableBalance } from 'src/ui/components/BlurrableBalance';
import { formatTokenValue } from 'src/shared/units/formatTokenValue';
import type { FungiblePosition } from 'src/modules/zerion-api/requests/wallet-get-simple-positions';
import { formatCurrencyValue } from 'src/shared/units/formatCurrencyValue/formatCurrencyValue';
import { useCurrency } from 'src/modules/currency/useCurrency';
import BigNumber from 'bignumber.js';
import type { Networks } from 'src/modules/networks/Networks';
import { useDialog2 } from 'src/ui/ui-kit/ModalDialogs/Dialog2';
import {
  QUICK_AMOUNTS,
  QuickAmountButton,
} from 'src/ui/shared/forms/QuickAmounts';
import { HStack } from 'src/ui/ui-kit/HStack/HStack';
import { FormFieldset } from './FormFieldset';
import type { HandleChangeFunction, SwapFormState2 } from './types';
import { AssetSelectorButton } from './AssetSelectorButton';
import { SpendPositionSelector } from './PositionSelector/SpendPositionSelector';

function getPartialBalance(balance: string, factor: number): string {
  if (factor === 1) return balance;
  const value = new BigNumber(balance).multipliedBy(factor);
  return value.gt(100)
    ? value.dp(0, BigNumber.ROUND_DOWN).toFixed()
    : value.precision(3, BigNumber.ROUND_DOWN).toFixed();
}

export function InputPosition({
  formState,
  onChange,
  position,
  positions,
  networks,
}: {
  formState: SwapFormState2;
  onChange: HandleChangeFunction;
  position: FungiblePosition | null;
  positions: FungiblePosition[];
  networks: Networks;
}) {
  const { currency } = useCurrency();
  const { inputAmount } = formState;
  const tokenValueInputRef = useRef<InputHandle | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const inputId = useId();
  const selectorDialog = useDialog2();

  const positionBalance = position?.amount.quantity ?? null;
  const notEnoughBalance =
    positionBalance !== null &&
    new BigNumber(inputAmount || '0').isGreaterThan(positionBalance);
  const inputValue = new BigNumber(inputAmount || '0').times(
    position?.fungible.meta.price || 0
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

  return (
    <>
      <FormFieldset
        inputId={inputId}
        startTitle={<UIText kind="small/regular">Pay with</UIText>}
        endTitle={
          positionBalance ? (
            <HStack gap={16} alignItems="center">
              {QUICK_AMOUNTS.map(({ factor, title }) => (
                <QuickAmountButton
                  key={factor}
                  onClick={() => {
                    const value = getPartialBalance(positionBalance, factor);
                    onChange('inputAmount', value);
                    tokenValueInputRef.current?.setValue(value);
                    if (inputRef.current) {
                      inputRef.current.value = value;
                      inputRef.current.focus();
                    }
                  }}
                >
                  {title}
                </QuickAmountButton>
              ))}
            </HStack>
          ) : (
            <div />
          )
        }
        startContent={
          <AssetSelectorButton
            position={position}
            onClick={selectorDialog.openDialog}
          />
        }
        endContent={
          <UIText kind="headline/h3">
            <DebouncedInput
              ref={tokenValueInputRef}
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
                  style={{ textAlign: 'end', textOverflow: 'ellipsis' }}
                  inputMode="decimal"
                  name="inputAmount"
                  value={value}
                  placeholder="0"
                  onChange={(event) =>
                    handleChange(
                      event.currentTarget.value
                        .replace(',', '.')
                        .replace(/\s/g, '')
                    )
                  }
                  pattern={FLOAT_INPUT_PATTERN}
                  required={true}
                />
              )}
            />
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
        endDescription={
          <UIText kind="small/regular">
            {formatCurrencyValue(inputValue, 'en', currency)}
          </UIText>
        }
      />
      <SpendPositionSelector
        open={selectorDialog.open}
        onClose={selectorDialog.closeDialog}
        positions={positions}
        networks={networks}
        currentChain={formState.inputChain}
        onSelect={(selected) => {
          onChange('inputChain', selected.chain.id);
          onChange('inputFungibleId', selected.fungible.id);
        }}
      />
    </>
  );
}

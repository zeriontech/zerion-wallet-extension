import React, { useId, useRef } from 'react';
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
import { FormFieldset } from './FormFieldset';
import type { HandleChangeFunction, SwapFormState2 } from './types';

export function InputPosition({
  formState,
  onChange,
  position,
}: {
  formState: SwapFormState2;
  onChange: HandleChangeFunction;
  position: FungiblePosition | null;
}) {
  const { currency } = useCurrency();
  const { inputAmount } = formState;
  const tokenValueInputRef = useRef<InputHandle | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const inputId = useId();

  const positionBalance = position?.amount.quantity ?? null;
  const notEnoughBalance =
    positionBalance !== null &&
    new BigNumber(inputAmount || '0').isGreaterThan(positionBalance);
  const inputValue = new BigNumber(inputAmount || '0').times(
    position?.fungible.meta.price || 0
  );

  return (
    <FormFieldset
      inputId={inputId}
      startTitle={<UIText kind="small/regular">Pay with</UIText>}
      endTitle={<div />}
      startContent={<div>Start Content</div>}
      endContent={
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
                  event.currentTarget.value.replace(',', '.').replace(/\s/g, '')
                )
              }
              pattern={FLOAT_INPUT_PATTERN}
              required={true}
            />
          )}
        />
      }
      startDescription={
        <div
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
        </div>
      }
      endDescription={
        <UIText kind="small/regular">
          {formatCurrencyValue(inputValue, 'en', currency)}
        </UIText>
      }
    />
  );
}

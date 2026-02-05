import React, { useEffect, useId, useRef, useMemo } from 'react';
import type { AddressPosition } from 'defi-sdk';
import type { EmptyAddressPosition } from '@zeriontech/transactions';
import {
  getPositionBalance,
  getPositionPartialBalance,
} from 'src/ui/components/Positions/helpers';
import {
  formatTokenValue,
  roundTokenValue,
} from 'src/shared/units/formatTokenValue';
import type { InputHandle } from 'src/ui/ui-kit/Input/DebouncedInput';
import { DebouncedInput } from 'src/ui/ui-kit/Input/DebouncedInput';
import { FormFieldset } from 'src/ui/ui-kit/FormFieldset';
import { UnstyledInput } from 'src/ui/ui-kit/UnstyledInput';
import { createChain } from 'src/modules/networks/Chain';
import { AssetSelect } from 'src/ui/pages/SendForm/AssetSelect';
import { FLOAT_INPUT_PATTERN } from 'src/ui/shared/forms/inputs';
import { useCustomValidity } from 'src/ui/shared/forms/useCustomValidity';
import { HStack } from 'src/ui/ui-kit/HStack';
import {
  getQuickAmounts,
  QuickAmountButton,
} from 'src/ui/shared/forms/QuickAmounts';
import { SpendFiatInputValue } from 'src/ui/components/FiatInputValue/FiatInputValue';
import type { NetworkConfig } from 'src/modules/networks/NetworkConfig';
import { BlurrableBalance } from 'src/ui/components/BlurrableBalance';
import type { SwapFormState } from '../../shared/SwapFormState';

export function SpendTokenField({
  formState,
  spendPosition,
  spendNetwork,
  receivePosition,
  positions,
  onChange,
  outputAmount,
}: {
  formState: SwapFormState;
  onChange: (key: keyof SwapFormState, value: string) => void;
  spendPosition: AddressPosition | EmptyAddressPosition | null;
  spendNetwork?: NetworkConfig;
  receivePosition: AddressPosition | EmptyAddressPosition | null;
  positions: AddressPosition[];
  outputAmount: string | null;
}) {
  const { inputAmount } = formState;
  const primaryInput = 'spend' as 'spend' | 'receive';

  const chain = formState.inputChain ? createChain(formState.inputChain) : null;

  const positionBalanceCommon = spendPosition
    ? getPositionBalance(spendPosition)
    : null;

  const exceedsBalance = Number(inputAmount) > Number(positionBalanceCommon);
  const tokenValueInputRef = useRef<InputHandle | null>(null);

  useEffect(() => {
    if (primaryInput === 'receive' && inputAmount) {
      /* formatted value must be a valid input value, e.g. 123456.67 and not 123,456.67 */
      const formatted = roundTokenValue(inputAmount);
      tokenValueInputRef.current?.setValue(formatted);
    } else if (primaryInput === 'receive') {
      tokenValueInputRef.current?.setValue('');
    }
  }, [primaryInput, inputAmount]);

  const primaryInputRef = useRef(primaryInput);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useCustomValidity({
    ref: inputRef,
    customValidity: exceedsBalance
      ? 'Insufficient balance'
      : inputAmount && Number(inputAmount) <= 0
      ? 'Enter a positive amount'
      : '',
  });

  useEffect(() => {
    if (primaryInputRef.current === 'receive' && primaryInput === 'spend') {
      // Detected change of primaryInput from 'receive' to 'spend',
      // We must set the store value to the formatted value so that
      // the /swap/quote/stream request is made with the value that the user sees
      onChange('inputAmount', inputRef.current?.value ?? '');
    }
    primaryInputRef.current = primaryInput;
  }, [primaryInput, inputAmount, onChange]);

  const quickAmounts = useMemo(() => {
    if (!spendPosition || !spendNetwork) {
      return [];
    }
    return getQuickAmounts(spendPosition.asset, spendNetwork);
  }, [spendPosition, spendNetwork]);

  const inputId = useId();
  return (
    <>
      <FormFieldset
        title="Pay with"
        endTitle={
          spendPosition && positionBalanceCommon ? (
            <HStack gap={16} alignItems="center">
              {quickAmounts.map(({ factor, title }) => (
                <QuickAmountButton
                  key={factor}
                  onClick={() => {
                    const value = getPositionPartialBalance(
                      spendPosition,
                      factor
                    ).toFixed();
                    onChange('inputAmount', value);
                    tokenValueInputRef.current?.setValue(value);
                    if (inputRef.current) {
                      inputRef.current.value = value;
                      inputRef.current.dispatchEvent(
                        new Event('customInputValueChange', { bubbles: true })
                      );
                      inputRef.current?.focus();
                    }
                  }}
                >
                  {title}
                </QuickAmountButton>
              ))}
            </HStack>
          ) : null
        }
        inputSelector={`#${CSS.escape(inputId)}`}
        startInput={
          <div>
            {spendPosition ? (
              <AssetSelect
                dialogTitle="Pay With"
                items={positions}
                onChange={(position) =>
                  onChange('inputFungibleId', position.asset.id)
                }
                chain={chain}
                selectedItem={spendPosition}
                noItemsMessage="No positions found"
                isLoading={false}
              />
            ) : (
              <div
                style={{
                  height: 24 /* height of AssetSelect */,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <svg
                  viewBox="0 0 20 20"
                  style={{
                    display: 'block',
                    width: 20,
                    height: 20,
                  }}
                >
                  <circle r="10" cx="10" cy="10" fill="var(--neutral-300)" />
                </svg>
              </div>
            )}
          </div>
        }
        endInput={
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
                required={primaryInput === 'spend'}
              />
            )}
          />
        }
        startDescription={
          <div style={{ color: 'var(--neutral-600)', display: 'flex', gap: 4 }}>
            <span>Balance:</span>
            <BlurrableBalance kind="small/regular" color="var(--neutral-600)">
              {positionBalanceCommon
                ? formatTokenValue(positionBalanceCommon)
                : 'n/a'}
            </BlurrableBalance>
          </div>
        }
        endDescription={
          <SpendFiatInputValue
            primaryInput={primaryInput}
            spendInput={inputAmount}
            spendAsset={spendPosition?.asset ?? null}
            receiveInput={outputAmount ?? ''}
            receiveAsset={receivePosition?.asset ?? null}
          />
        }
      />
    </>
  );
}

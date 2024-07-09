import React, { useEffect, useId, useRef } from 'react';
import type { SwapFormView } from '@zeriontech/transactions';
import { useSelectorStore } from '@store-unit/react';
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
  QUICK_AMOUNTS,
  QuickAmountButton,
} from 'src/ui/shared/forms/QuickAmounts';
import { FiatInputValue } from '../FiatInputValue';

export function SpendTokenField({ swapView }: { swapView: SwapFormView }) {
  const { spendPosition } = swapView;
  const { primaryInput, spendInput, chainInput } = useSelectorStore(
    swapView.store,
    ['primaryInput', 'spendInput', 'chainInput']
  );
  const chain = chainInput ? createChain(chainInput) : null;

  const positionBalanceCommon = spendPosition
    ? getPositionBalance(spendPosition)
    : null;

  const exceedsBalance = Number(spendInput) > Number(positionBalanceCommon);
  const tokenValueInputRef = useRef<InputHandle | null>(null);

  useEffect(() => {
    if (primaryInput === 'receive' && spendInput) {
      /* formatted value must be a valid input value, e.g. 123456.67 and not 123,456.67 */
      const formatted = roundTokenValue(spendInput);
      tokenValueInputRef.current?.setValue(formatted);
    } else if (primaryInput === 'receive') {
      tokenValueInputRef.current?.setValue('');
    }
  }, [primaryInput, spendInput]);

  const primaryInputRef = useRef(primaryInput);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useCustomValidity({
    ref: inputRef,
    customValidity: exceedsBalance
      ? 'Insufficient balance'
      : spendInput && Number(spendInput) <= 0
      ? 'Enter a positive amount'
      : '',
  });

  useEffect(() => {
    if (primaryInputRef.current === 'receive' && primaryInput === 'spend') {
      // Detected change of primaryInput from 'receive' to 'spend',
      // We must set the store value to the formatted value so that
      // the /swap/quote/stream request is made with the value that the user sees
      swapView.store.handleChange('spendInput', inputRef.current?.value ?? '');
    }
    primaryInputRef.current = primaryInput;
  }, [primaryInput, spendInput, swapView.store]);

  const inputId = useId();
  return (
    <>
      <FormFieldset
        title="Pay with"
        endTitle={
          spendPosition && positionBalanceCommon ? (
            <HStack gap={16} alignItems="center">
              {QUICK_AMOUNTS.map(({ factor, title }) => (
                <QuickAmountButton
                  key={factor}
                  onClick={() => {
                    const value = getPositionPartialBalance(
                      spendPosition,
                      factor
                    ).toFixed();
                    swapView.store.handleAmountChange('spend', value);
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
                items={swapView.availablePositions}
                onChange={(position) =>
                  swapView.store.handleTokenChange(
                    'spendTokenInput',
                    position.asset.asset_code
                  )
                }
                chain={chain}
                selectedItem={spendPosition}
                noItemsMessage="No positions found"
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
            value={spendInput ?? ''}
            onChange={(value) => {
              swapView.store.handleAmountChange('spend', value);
            }}
            render={({ value, handleChange }) => (
              <UnstyledInput
                autoFocus={true}
                id={inputId}
                ref={inputRef}
                style={{ textAlign: 'end', textOverflow: 'ellipsis' }}
                inputMode="decimal"
                name="spendInput"
                value={value}
                placeholder="0"
                onChange={(event) =>
                  handleChange(event.currentTarget.value.replace(',', '.'))
                }
                pattern={FLOAT_INPUT_PATTERN}
                required={primaryInput === 'spend'}
              />
            )}
          />
        }
        startDescription={
          <div style={{ color: 'var(--neutral-600)' }}>
            Balance:{' '}
            {positionBalanceCommon
              ? formatTokenValue(positionBalanceCommon)
              : 'n/a'}
          </div>
        }
        endDescription={
          <FiatInputValue swapView={swapView} name="spendInput" />
        }
      />
    </>
  );
}

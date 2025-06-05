import type { EmptyAddressPosition } from '@zeriontech/transactions';
import type { AddressPosition, Asset } from 'defi-sdk';
import React, { useId, useRef } from 'react';
import type { Chain } from 'src/modules/networks/Chain';
import { formatTokenValue } from 'src/shared/units/formatTokenValue';
import { SpendFiatInputValue } from 'src/ui/components/FiatInputValue/FiatInputValue';
import {
  getPositionBalance,
  getPositionPartialBalance,
} from 'src/ui/components/Positions/helpers';
import { AssetSelect } from 'src/ui/pages/SendForm/AssetSelect';
import {
  QUICK_AMOUNTS,
  QuickAmountButton,
} from 'src/ui/shared/forms/QuickAmounts';
import { FLOAT_INPUT_PATTERN } from 'src/ui/shared/forms/inputs';
import { useCustomValidity } from 'src/ui/shared/forms/useCustomValidity';
import { FormFieldset } from 'src/ui/ui-kit/FormFieldset';
import { HStack } from 'src/ui/ui-kit/HStack';
import {
  DebouncedInput,
  type InputHandle,
} from 'src/ui/ui-kit/Input/DebouncedInput';
import { UnstyledInput } from 'src/ui/ui-kit/UnstyledInput';

export function SpendTokenField({
  spendInput,
  spendChain,
  spendPosition,
  availableSpendPositions,
  receiveInput,
  receiveAsset,
  onChangeAmount,
  onChangeToken,
}: {
  spendInput?: string;
  spendChain: Chain | null;
  spendPosition: AddressPosition | EmptyAddressPosition | null;
  availableSpendPositions: AddressPosition[];
  receiveInput?: string;
  receiveAsset: Asset | null;
  onChangeAmount: (value: string) => void;
  onChangeToken: (value: string) => void;
}) {
  const positionBalanceCommon = spendPosition
    ? getPositionBalance(spendPosition)
    : null;

  const exceedsBalance = Number(spendInput) > Number(positionBalanceCommon);
  const tokenValueInputRef = useRef<InputHandle | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);

  useCustomValidity({
    ref: inputRef,
    customValidity: exceedsBalance
      ? 'Insufficient balance'
      : spendInput && Number(spendInput) <= 0
      ? 'Enter a positive amount'
      : '',
  });

  const inputId = useId();

  return (
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

                  onChangeAmount(value);

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
              items={availableSpendPositions}
              onChange={(position) => onChangeToken(position.asset.asset_code)}
              chain={spendChain}
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
          onChange={(value) => onChangeAmount(value)}
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
              required={true}
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
        <SpendFiatInputValue
          primaryInput="spend"
          spendInput={spendInput}
          spendAsset={spendPosition?.asset ?? null}
          receiveInput={receiveInput}
          receiveAsset={receiveAsset}
        />
      }
    />
  );
}

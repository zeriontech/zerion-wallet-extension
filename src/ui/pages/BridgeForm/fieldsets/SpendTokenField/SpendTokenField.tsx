import type { EmptyAddressPosition } from '@zeriontech/transactions';
import type { AddressPosition, Asset } from 'defi-sdk';
import React, { useId, useMemo, useRef } from 'react';
import type { Chain } from 'src/modules/networks/Chain';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { formatTokenValue } from 'src/shared/units/formatTokenValue';
import { FiatInputValue } from 'src/ui/components/FiatInputValue';
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
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledInput } from 'src/ui/ui-kit/UnstyledInput';

export function SpendTokenField({
  spendInput,
  spendChain,
  spendAsset,
  spendPosition,
  availableSpendPositions,
  receiveInput,
  receiveAsset,
  onChangeAmount,
  onChangeToken,
}: {
  spendInput?: string;
  spendChain: Chain | null;
  spendAsset: Asset | null;
  spendPosition: AddressPosition | EmptyAddressPosition | null;
  availableSpendPositions: AddressPosition[];
  receiveInput?: string;
  receiveAsset: Asset | null;
  onChangeAmount: (value: string) => void;
  onChangeToken: (value: string) => void;
}) {
  const { networks } = useNetworks(
    spendChain ? [spendChain.toString()] : undefined
  );

  const spendChainName = useMemo(
    () => (spendChain && networks ? networks.getChainName(spendChain) : null),
    [networks, spendChain]
  );

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
            <UIText kind="small/accent" style={{ whiteSpace: 'nowrap' }}>
              No available positions{' '}
              {spendChainName ? `on ${spendChainName}` : null}
            </UIText>
          )}
        </div>
      }
      endInput={
        spendPosition ? (
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
        ) : null
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
        spendPosition ? (
          <FiatInputValue
            name="spendInput"
            primaryInput="spend"
            spendInput={spendInput}
            spendAsset={spendAsset}
            receiveInput={receiveInput}
            receiveAsset={receiveAsset}
          />
        ) : null
      }
    />
  );
}

import React, { useEffect, useId, useMemo, useRef } from 'react';
import { getPositionBalance } from 'src/ui/components/Positions/helpers';
import {
  formatTokenValue,
  roundTokenValue,
} from 'src/shared/units/formatTokenValue';
import type { InputHandle } from 'src/ui/ui-kit/Input/DebouncedInput';
import { DebouncedInput } from 'src/ui/ui-kit/Input/DebouncedInput';
import { FormFieldset } from 'src/ui/ui-kit/FormFieldset';
import { UnstyledInput } from 'src/ui/ui-kit/UnstyledInput';
import type { Chain } from 'src/modules/networks/Chain';
import { NBSP } from 'src/ui/shared/typography';
import { FLOAT_INPUT_PATTERN } from 'src/ui/shared/forms/inputs';
import type { AddressPosition, Asset } from 'defi-sdk';
import { MarketAssetSelect } from 'src/ui/pages/SwapForm/fieldsets/ReceiveTokenField/MarketAssetSelect';
import type { EmptyAddressPosition } from '@zeriontech/transactions';
import { ReceiveFiatInputValue } from 'src/ui/components/FiatInputValue/FiatInputValue';
import { calculatePriceImpact } from 'src/ui/pages/SwapForm/shared/price-impact';

export function ReceiveTokenField({
  receiveInput,
  receiveChain,
  receiveAsset,
  receivePosition,
  availableReceivePositions,
  spendInput,
  spendAsset,
  onChangeAmount,
  onChangeToken,
}: {
  receiveInput?: string;
  receiveChain: Chain | null;
  receiveAsset: Asset | null;
  receivePosition: AddressPosition | EmptyAddressPosition | null;
  availableReceivePositions: AddressPosition[];
  spendInput?: string;
  spendAsset: Asset | null;
  onChangeAmount: (value: string) => void;
  onChangeToken: (value: string) => void;
}) {
  const positionBalanceCommon = receivePosition
    ? getPositionBalance(receivePosition)
    : null;

  const tokenValueInputRef = useRef<InputHandle | null>(null);

  useEffect(() => {
    if (receiveInput) {
      // formatted value must be a valid input value,
      // e.g. 123456.67 and not 123,456.67
      const formatted = roundTokenValue(receiveInput);
      tokenValueInputRef.current?.setValue(formatted);
    } else {
      tokenValueInputRef.current?.setValue('');
    }
  }, [receiveInput]);

  const priceImpact = useMemo(
    () =>
      calculatePriceImpact({
        inputValue: spendInput ?? null,
        outputValue: receiveInput ?? null,
        inputAsset: spendAsset,
        outputAsset: receiveAsset,
      }),
    [receiveAsset, receiveInput, spendAsset, spendInput]
  );

  const inputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <>
      <FormFieldset
        title="Receive"
        inputSelector={`#${CSS.escape(inputId)}`}
        startInput={
          <div>
            {receiveChain ? (
              <MarketAssetSelect
                chain={receiveChain}
                selectedItem={receivePosition}
                onChange={(position) =>
                  onChangeToken(position.asset.asset_code)
                }
                addressPositions={availableReceivePositions}
              />
            ) : null}
          </div>
        }
        endInput={
          <DebouncedInput
            ref={tokenValueInputRef}
            delay={300}
            value={receiveInput ?? ''}
            onChange={(value) => onChangeAmount(value)}
            render={({ value, handleChange }) => (
              <UnstyledInput
                readOnly={true}
                ref={inputRef}
                style={{
                  textAlign: 'end',
                  textOverflow: 'ellipsis',
                  cursor: 'default',
                }}
                id={inputId}
                inputMode="decimal"
                name="receiveInput"
                value={value}
                placeholder="0"
                onChange={(event) =>
                  handleChange(event.currentTarget.value.replace(',', '.'))
                }
                pattern={FLOAT_INPUT_PATTERN}
                required={false}
              />
            )}
          />
        }
        startDescription={
          <div>
            {positionBalanceCommon ? (
              <>
                <span style={{ color: 'var(--neutral-600)' }}>Balance:</span>{' '}
                <span
                  style={{
                    color: 'var(--neutral-600)',
                  }}
                >
                  {formatTokenValue(positionBalanceCommon)}
                </span>
              </>
            ) : (
              NBSP
            )}
          </div>
        }
        endDescription={
          <ReceiveFiatInputValue
            primaryInput="spend"
            spendInput={spendInput}
            spendAsset={spendAsset}
            receiveInput={receiveInput}
            receiveAsset={receiveAsset}
            priceImpact={priceImpact}
          />
        }
      />
    </>
  );
}

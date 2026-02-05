import React, { useEffect, useId, useRef } from 'react';
import type { AddressPosition } from 'defi-sdk';
import type { EmptyAddressPosition } from '@zeriontech/transactions';
import { getPositionBalance } from 'src/ui/components/Positions/helpers';
import {
  formatTokenValue,
  roundTokenValue,
} from 'src/shared/units/formatTokenValue';
import type { InputHandle } from 'src/ui/ui-kit/Input/DebouncedInput';
import { DebouncedInput } from 'src/ui/ui-kit/Input/DebouncedInput';
import { FormFieldset } from 'src/ui/ui-kit/FormFieldset';
import { UnstyledInput } from 'src/ui/ui-kit/UnstyledInput';
import { createChain } from 'src/modules/networks/Chain';
import { NBSP } from 'src/ui/shared/typography';
import { FLOAT_INPUT_PATTERN } from 'src/ui/shared/forms/inputs';
import { useCustomValidity } from 'src/ui/shared/forms/useCustomValidity';
import { ReceiveFiatInputValue } from 'src/ui/components/FiatInputValue/FiatInputValue';
import { BlurrableBalance } from 'src/ui/components/BlurrableBalance';
import type { PriceImpact } from '../../shared/price-impact';
import type { SwapFormState } from '../../shared/SwapFormState';
import { MarketAssetSelect } from './MarketAssetSelect';

export function ReceiveTokenField({
  formState,
  spendPosition,
  receivePosition,
  positions,
  onChange,
  outputAmount,
  priceImpact,
  showPriceImpactWarning,
  readOnly = true,
}: {
  formState: SwapFormState;
  onChange: (key: keyof SwapFormState, value: string) => void;
  spendPosition: AddressPosition | EmptyAddressPosition | null;
  receivePosition: AddressPosition | EmptyAddressPosition | null;
  positions: AddressPosition[];
  outputAmount: string | null;
  priceImpact: PriceImpact | null;
  showPriceImpactWarning: boolean;
  readOnly?: boolean;
}) {
  const { inputAmount } = formState;
  const primaryInput = 'spend' as 'spend' | 'receive';

  const chain = formState.inputChain ? createChain(formState.inputChain) : null;

  const positionBalanceCommon = receivePosition
    ? getPositionBalance(receivePosition)
    : null;

  const tokenValueInputRef = useRef<InputHandle | null>(null);

  useEffect(() => {
    if (primaryInput === 'spend' && outputAmount) {
      /* formatted value must be a valid input value, e.g. 123456.67 and not 123,456.67 */
      const formatted = roundTokenValue(outputAmount);
      tokenValueInputRef.current?.setValue(formatted);
    } else if (primaryInput === 'spend') {
      tokenValueInputRef.current?.setValue('');
    }
  }, [primaryInput, outputAmount]);

  const inputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);

  useCustomValidity({
    ref: inputRef,
    customValidity:
      primaryInput === 'receive' && outputAmount && Number(outputAmount) <= 0
        ? 'Enter a positive amount'
        : '',
  });

  return (
    <>
      <FormFieldset
        title="Receive"
        inputSelector={`#${CSS.escape(inputId)}`}
        startInput={
          <div>
            {chain ? (
              <MarketAssetSelect
                chain={chain}
                selectedItem={receivePosition}
                onChange={(position) =>
                  onChange('outputFungibleId', position.asset.id)
                }
                addressPositions={positions}
                isLoading={false}
              />
            ) : null}
          </div>
        }
        endInput={
          <DebouncedInput
            ref={tokenValueInputRef}
            delay={300}
            value={outputAmount ?? ''}
            onChange={(_value) => {
              if (readOnly) {
                // do nothing
              } else {
                // Currently not supported
                // onChange('outputAmount', value);
              }
            }}
            render={({ value, handleChange }) => (
              <UnstyledInput
                readOnly={readOnly}
                ref={inputRef}
                style={{
                  textAlign: 'end',
                  textOverflow: 'ellipsis',
                  cursor: readOnly ? 'default' : undefined,
                }}
                id={inputId}
                inputMode="decimal"
                name="receiveInput"
                value={value}
                placeholder="0"
                onChange={(event) =>
                  handleChange(
                    event.currentTarget.value.replace(',', '.').replace(/\s/g, '')
                  )
                }
                pattern={FLOAT_INPUT_PATTERN}
                required={primaryInput === 'receive'}
              />
            )}
          />
        }
        startDescription={
          <div style={{ color: 'var(--neutral-600)', display: 'flex', gap: 4 }}>
            {positionBalanceCommon ? (
              <>
                <span>Balance:</span>
                <BlurrableBalance
                  kind="small/regular"
                  color="var(--neutral-600)"
                >
                  {formatTokenValue(positionBalanceCommon)}
                </BlurrableBalance>
              </>
            ) : (
              NBSP
            )}
          </div>
        }
        endDescription={
          <ReceiveFiatInputValue
            primaryInput={primaryInput}
            spendInput={inputAmount}
            spendAsset={spendPosition?.asset ?? null}
            receiveInput={outputAmount ?? ''}
            receiveAsset={receivePosition?.asset ?? null}
            priceImpact={priceImpact}
            showPriceImpactWarning={showPriceImpactWarning}
          />
        }
      />
    </>
  );
}

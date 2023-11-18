import React, { useEffect, useId, useRef } from 'react';
import type { SwapFormView } from '@zeriontech/transactions';
import { useSelectorStore } from '@store-unit/react';
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
import { AssetSelect } from 'src/ui/pages/SendForm/AssetSelect';
import { NBSP } from 'src/ui/shared/typography';
import { FLOAT_INPUT_PATTERN } from 'src/ui/shared/forms/inputs';

export function ReceiveTokenField({ swapView }: { swapView: SwapFormView }) {
  const { receivePosition } = swapView;
  const { primaryInput, receiveInput, chainInput } = useSelectorStore(
    swapView.store,
    ['primaryInput', 'receiveInput', 'chainInput']
  );
  const chain = chainInput ? createChain(chainInput) : null;

  const positionBalanceCommon = receivePosition
    ? getPositionBalance(receivePosition)
    : null;

  const tokenValueInputRef = useRef<InputHandle | null>(null);

  useEffect(() => {
    if (primaryInput === 'spend' && receiveInput) {
      /* formatted value must be a valid input value, e.g. 123456.67 and not 123,456.67 */
      const formatted = roundTokenValue(receiveInput);
      tokenValueInputRef.current?.setValue(formatted);
      console.log('setting receive input value in effect', formatted);
    } else if (primaryInput === 'spend') {
      tokenValueInputRef.current?.setValue('');
      console.log('setting receive input value in effect', 'empty');
    }
  }, [primaryInput, receiveInput]);

  const inputId = useId();
  return (
    <>
      <FormFieldset
        title="Receive"
        inputSelector={`#${CSS.escape(inputId)}`}
        startInput={
          <div>
            {receivePosition ? (
              <AssetSelect
                items={swapView.availablePositions}
                onChange={(position) =>
                  swapView.store.handleTokenChange(
                    'receiveTokenInput',
                    position.asset.asset_code
                  )
                }
                chain={chain}
                selectedItem={receivePosition}
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
            value={receiveInput ?? ''}
            onChange={(value) => {
              swapView.store.handleAmountChange('receive', value);
            }}
            render={({ value, handleChange }) => (
              <UnstyledInput
                id={inputId}
                style={{ textAlign: 'end', textOverflow: 'ellipsis' }}
                inputMode="decimal"
                name="receiveInput"
                value={value}
                placeholder="0"
                onChange={(event) =>
                  handleChange(event.currentTarget.value.replace(',', '.'))
                }
                pattern={FLOAT_INPUT_PATTERN}
                required={primaryInput === 'receive'}
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
      />
    </>
  );
}

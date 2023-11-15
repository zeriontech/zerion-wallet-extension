import React, { useId, useRef } from 'react';
import type { SendFormView } from '@zeriontech/transactions';
import { useSelectorStore } from '@store-unit/react';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { invariant } from 'src/shared/invariant';
import { getPositionBalance } from 'src/ui/components/Positions/helpers';
import { formatTokenValue } from 'src/shared/units/formatTokenValue';
import type { InputHandle } from 'src/ui/ui-kit/Input/DebouncedInput';
import { DebouncedInput } from 'src/ui/ui-kit/Input/DebouncedInput';
import { FormFieldset } from 'src/ui/ui-kit/FormFieldset';
import { UnstyledInput } from 'src/ui/ui-kit/UnstyledInput';
import { createChain } from 'src/modules/networks/Chain';
import { AssetSelect } from '../../AssetSelect';

export function TokenTransferInput({ sendView }: { sendView: SendFormView }) {
  const { tokenItem } = sendView;
  const { tokenValue, tokenChain } = useSelectorStore(sendView.store, [
    'tokenValue',
    'tokenChain',
  ]);
  const chain = tokenChain ? createChain(tokenChain) : null;

  const positionBalanceCommon = tokenItem
    ? getPositionBalance(tokenItem)
    : null;

  const exceedsBalance = Number(tokenValue) > Number(positionBalanceCommon);
  const tokenValueInputRef = useRef<InputHandle | null>(null);

  const inputId = useId();
  return (
    <>
      <FormFieldset
        title="Asset"
        inputSelector={`#${CSS.escape(inputId)}`}
        startInput={
          <div>
            {tokenItem ? (
              <AssetSelect
                items={sendView.availablePositions ?? []}
                onChange={(position) =>
                  sendView.handleChange(
                    'tokenAssetCode',
                    position.asset.asset_code
                  )
                }
                chain={chain}
                selectedItem={tokenItem}
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
            value={tokenValue ?? ''}
            onChange={(value) => {
              sendView.handleChange('tokenValue', value);
            }}
            render={({ value, handleChange }) => (
              <UnstyledInput
                id={inputId}
                style={{ textAlign: 'end', textOverflow: 'ellipsis' }}
                inputMode="numeric"
                name="tokenValue"
                value={value}
                placeholder="0"
                onChange={(event) => handleChange(event.currentTarget.value)}
                required={true}
              />
            )}
          />
        }
        startDescription={
          <div>
            <span style={{ color: 'var(--neutral-600)' }}>Balance:</span>{' '}
            <UnstyledButton
              type="button"
              style={{
                color: exceedsBalance
                  ? 'var(--negative-500)'
                  : 'var(--primary)',
              }}
              disabled={positionBalanceCommon == null}
              onClick={() => {
                invariant(positionBalanceCommon, 'Position quantity unknown');
                const value = positionBalanceCommon.toFixed();
                sendView.handleChange('tokenValue', value);
                tokenValueInputRef.current?.setValue(value);
              }}
            >
              {positionBalanceCommon
                ? formatTokenValue(positionBalanceCommon)
                : 'n/a'}
            </UnstyledButton>
          </div>
        }
      />
    </>
  );
}

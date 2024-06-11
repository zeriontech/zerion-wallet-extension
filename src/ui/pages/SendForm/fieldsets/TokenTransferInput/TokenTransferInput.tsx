import React, { useId, useRef } from 'react';
import type { SendFormView } from '@zeriontech/transactions';
import { useSelectorStore } from '@store-unit/react';
import {
  getPositionBalance,
  getPositionPartialBalance,
} from 'src/ui/components/Positions/helpers';
import { formatTokenValue } from 'src/shared/units/formatTokenValue';
import type { InputHandle } from 'src/ui/ui-kit/Input/DebouncedInput';
import { DebouncedInput } from 'src/ui/ui-kit/Input/DebouncedInput';
import { FormFieldset } from 'src/ui/ui-kit/FormFieldset';
import { UnstyledInput } from 'src/ui/ui-kit/UnstyledInput';
import { createChain } from 'src/modules/networks/Chain';
import { FLOAT_INPUT_PATTERN } from 'src/ui/shared/forms/inputs';
import { useCustomValidity } from 'src/ui/shared/forms/useCustomValidity';
import { isNumeric } from 'src/shared/isNumeric';
import BigNumber from 'bignumber.js';
import { UIText } from 'src/ui/ui-kit/UIText';
import { formatCurrencyValue } from 'src/shared/units/formatCurrencyValue';
import { HStack } from 'src/ui/ui-kit/HStack';
import {
  QUICK_AMOUNTS,
  QuickAmountButton,
} from 'src/ui/shared/forms/QuickAmounts';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { AssetSelect } from '../../AssetSelect';

function FiatInputValue({ sendView }: { sendView: SendFormView }) {
  const { tokenItem } = sendView;
  const { currency } = useCurrency();
  const { type, tokenValue: inputValue } = useSelectorStore(sendView.store, [
    'type',
    'tokenValue',
  ]);

  if (type === 'nft') {
    return null;
  }
  const asset = tokenItem?.asset;

  if (inputValue == null || !isNumeric(inputValue)) {
    return null;
  }

  const fiatValue = new BigNumber(inputValue || 0).times(
    asset?.price?.value || 0
  );

  return (
    <UIText kind="small/regular" color="var(--neutral-600)">
      {formatCurrencyValue(fiatValue, 'en', currency)}
    </UIText>
  );
}

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
  const inputRef = useRef<HTMLInputElement | null>(null);

  useCustomValidity({
    ref: inputRef,
    customValidity: exceedsBalance
      ? 'Insufficient balance'
      : tokenValue && Number(tokenValue) < 0
      ? 'Enter a positive amount'
      : '',
  });

  return (
    <>
      <FormFieldset
        title="Asset"
        endTitle={
          tokenItem && positionBalanceCommon ? (
            <HStack gap={16} alignItems="center">
              {QUICK_AMOUNTS.map(({ factor, title }) => (
                <QuickAmountButton
                  key={factor}
                  onClick={() => {
                    const value = getPositionPartialBalance(
                      tokenItem,
                      factor
                    ).toFixed();
                    sendView.handleChange('tokenValue', value);
                    tokenValueInputRef.current?.setValue(value);
                    inputRef.current?.focus();
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
            {tokenItem ? (
              <AssetSelect
                dialogTitle="Send"
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
                ref={inputRef}
                style={{ textAlign: 'end', textOverflow: 'ellipsis' }}
                name="tokenValue"
                value={value}
                placeholder="0"
                inputMode="decimal"
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
        endDescription={<FiatInputValue sendView={sendView} />}
      />
    </>
  );
}

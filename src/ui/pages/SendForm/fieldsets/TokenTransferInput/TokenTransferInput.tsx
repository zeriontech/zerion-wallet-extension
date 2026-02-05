import React, { useId, useMemo, useRef } from 'react';
import type { AddressPosition } from 'defi-sdk';
import type { EmptyAddressPosition } from '@zeriontech/transactions';
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
  getQuickAmounts,
  QuickAmountButton,
} from 'src/ui/shared/forms/QuickAmounts';
import { useCurrency } from 'src/modules/currency/useCurrency';
import type { NetworkConfig } from 'src/modules/networks/NetworkConfig';
import { BlurrableBalance } from 'src/ui/components/BlurrableBalance';
import { AssetSelect } from '../../AssetSelect';

function FiatInputValue({
  position: tokenItem,
  type,
  value: inputValue,
}: {
  position: AddressPosition | EmptyAddressPosition | null;
  value: string;
  type: 'nft' | 'token';
}) {
  const { currency } = useCurrency();

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

export function TokenTransferInput<
  T extends AddressPosition | EmptyAddressPosition
>({
  type,
  value,
  onChange,
  items,
  currentItem,
  tokenAssetCode: _,
  onAssetCodeChange,
  network,
}: {
  type: 'nft' | 'token';
  value: string;
  onChange: (value: string) => void;
  items: Array<T>;
  currentItem: T | null;
  tokenAssetCode: string | null;
  onAssetCodeChange: (value: string) => void;
  network?: NetworkConfig;
}) {
  const positionBalanceCommon = currentItem
    ? getPositionBalance(currentItem)
    : null;

  const exceedsBalance = Number(value) > Number(positionBalanceCommon);
  const tokenValueInputRef = useRef<InputHandle | null>(null);

  const inputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);

  useCustomValidity({
    ref: inputRef,
    customValidity: exceedsBalance
      ? 'Insufficient balance'
      : value && Number(value) < 0
      ? 'Enter a positive amount'
      : '',
  });

  const quickAmounts = useMemo(() => {
    if (!currentItem || !network) {
      return [];
    }
    return getQuickAmounts(currentItem.asset, network);
  }, [currentItem, network]);

  const chain = network ? createChain(network.id) : null;

  return (
    <>
      <FormFieldset
        title="Asset"
        endTitle={
          currentItem && positionBalanceCommon ? (
            <HStack gap={16} alignItems="center">
              {quickAmounts.map(({ factor, title }) => (
                <QuickAmountButton
                  key={factor}
                  onClick={() => {
                    const value = getPositionPartialBalance(
                      currentItem,
                      factor
                    ).toFixed();
                    onChange(value);
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
            {currentItem ? (
              <AssetSelect
                dialogTitle="Send"
                items={items}
                onChange={(position) =>
                  onAssetCodeChange(position.asset.asset_code)
                }
                chain={chain}
                selectedItem={currentItem}
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
            value={value ?? ''}
            onChange={onChange}
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
          <div style={{ color: 'var(--neutral-600)', display: 'flex', gap: 4 }}>
            <span>Balance:</span>
            <BlurrableBalance kind="small/regular">
              {positionBalanceCommon
                ? formatTokenValue(positionBalanceCommon)
                : 'n/a'}
            </BlurrableBalance>
          </div>
        }
        endDescription={
          <FiatInputValue position={currentItem} type={type} value={value} />
        }
      />
    </>
  );
}

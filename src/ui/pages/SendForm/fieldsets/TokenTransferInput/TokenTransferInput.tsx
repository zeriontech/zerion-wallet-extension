import React from 'react';
import { Media } from 'src/ui/ui-kit/Media';
import type { SendFormView } from '@zeriontech/transactions';
import { VStack } from 'src/ui/ui-kit/VStack';
import { Input } from 'src/ui/ui-kit/Input';
import { useSelectorStore } from '@store-unit/react';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { invariant } from 'src/shared/invariant';
import { getPositionBalance } from 'src/ui/components/Positions/helpers';
import { formatTokenValue } from 'src/shared/units/formatTokenValue';
import { DebouncedInput } from 'src/ui/ui-kit/Input/DebouncedInput';

export function TokenTransferInput({ sendView }: { sendView: SendFormView }) {
  const { tokenItem } = sendView;
  const { tokenValue } = useSelectorStore(sendView.store, ['tokenValue']);

  const positionBalanceCommon = tokenItem
    ? getPositionBalance(tokenItem)
    : null;

  const exceedsBalance = Number(tokenValue) > Number(positionBalanceCommon);

  return (
    <>
      <Media
        image={
          tokenItem?.asset.icon_url ? (
            <img
              src={tokenItem.asset.icon_url}
              style={{ width: 24, height: 24 }}
            />
          ) : (
            <svg viewBox="0 0 24 24" style={{ width: 24, height: 24 }}>
              <circle r="12" rx="12" ry="12" fill="var(--neutral-300)" />
            </svg>
          )
        }
        text={
          tokenItem
            ? tokenItem.asset.name ?? tokenItem.asset.symbol
            : 'No asset selected'
        }
        detailText={null}
      />

      <select
        name="tokenAssetCode"
        value={sendView.tokenItem?.asset.asset_code}
        onChange={(event) => {
          sendView.handleChange('tokenAssetCode', event.currentTarget.value);
        }}
      >
        {sendView.availablePositions?.map((position) => (
          <option key={position.asset.id} value={position.asset.asset_code}>
            {position.asset.name ?? position.asset.symbol}
          </option>
        )) ?? <option>no positions</option>}
      </select>
      <VStack gap={4}>
        <DebouncedInput
          delay={300}
          value={tokenValue ?? ''}
          onChange={(value) => {
            sendView.handleChange('tokenValue', value);
          }}
          render={({ value, handleChange }) => (
            <Input
              inputMode="numeric"
              name="tokenValue"
              value={value}
              placeholder="0"
              onChange={(event) => handleChange(event.currentTarget.value)}
              required={true}
            />
          )}
        />
        <div>
          <UnstyledButton
            type="button"
            style={{
              color: exceedsBalance ? 'var(--negative-500)' : 'var(--primary)',
            }}
            disabled={positionBalanceCommon == null || exceedsBalance}
            onClick={() => {
              invariant(positionBalanceCommon, 'Position quantity unknown');
              sendView.handleChange(
                'tokenValue',
                positionBalanceCommon.toFixed()
              );
            }}
          >
            Balance:{' '}
            {positionBalanceCommon
              ? formatTokenValue(positionBalanceCommon)
              : 'n/a'}
          </UnstyledButton>
        </div>
      </VStack>
    </>
  );
}

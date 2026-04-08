import React, { useId } from 'react';
import { UIText } from 'src/ui/ui-kit/UIText';
import type { FungiblePosition } from 'src/modules/zerion-api/requests/wallet-get-simple-positions';
import { HStack } from 'src/ui/ui-kit/HStack';
import { BlurrableBalance } from 'src/ui/components/BlurrableBalance';
import { formatTokenValue } from 'src/shared/units/formatTokenValue';
import BigNumber from 'bignumber.js';
import { formatCurrencyValue } from 'src/shared/units/formatCurrencyValue';
import { useCurrency } from 'src/modules/currency/useCurrency';
import type { HandleChangeFunction, SwapFormState2 } from './types';
import { FormFieldset } from './FormFieldset';

export function OutputPosition({
  formState,
  onChange,
  position,
  outputAmount,
}: {
  formState: SwapFormState2;
  onChange: HandleChangeFunction;
  position: FungiblePosition | null;
  outputAmount: string | null;
}) {
  const { currency } = useCurrency();
  const inputId = useId();
  const positionBalance = position?.amount.quantity ?? null;

  const inputValue = new BigNumber(outputAmount || '0').times(
    position?.fungible.meta.price || 0
  );

  return (
    <FormFieldset
      inputId={inputId}
      startTitle={<UIText kind="small/regular">Receive</UIText>}
      endTitle={<div />}
      startContent={<div>Start Content</div>}
      endContent={
        <div
          style={{
            color: outputAmount != null ? undefined : 'var(--neutral-400)',
          }}
        >
          {outputAmount != null ? outputAmount : '0'}
        </div>
      }
      startDescription={
        <HStack gap={4} alignItems="center">
          <span>Balance:</span>
          <BlurrableBalance kind="small/regular">
            {positionBalance ? formatTokenValue(positionBalance) : null}
          </BlurrableBalance>
        </HStack>
      }
      endDescription={
        <UIText kind="small/regular">
          {formatCurrencyValue(inputValue, 'en', currency)}
        </UIText>
      }
    />
  );
}

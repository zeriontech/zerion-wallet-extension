import { type Asset } from 'defi-sdk';
import BigNumber from 'bignumber.js';
import React from 'react';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { formatCurrencyValue } from 'src/shared/units/formatCurrencyValue';
import { formatPercent } from 'src/shared/units/formatPercent';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import type { Chain } from 'src/modules/networks/Chain';
import type { SwapFormState } from '../shared/SwapFormState';
import { getSlippageOptions } from './getSlippageOptions';

const HIGH_SLIPPAGE_THRESHOLD = 0.01; // 1%

export function SlippageLine({
  chain,
  formState,
  receiveAsset,
  outputAmount,
}: {
  chain: Chain;
  formState: SwapFormState;
  receiveAsset: Asset | null;
  outputAmount: string | null;
}) {
  const { currency } = useCurrency();

  const { slippage } = getSlippageOptions({
    chain,
    userSlippage: formState.slippage ? Number(formState.slippage) : null,
  });

  const price = receiveAsset?.price?.value || 0;
  const fiatValue = new BigNumber(outputAmount || 0)
    .times(price)
    .times(1 - slippage);

  return slippage > HIGH_SLIPPAGE_THRESHOLD ? (
    <VStack gap={8}>
      <HStack gap={8} justifyContent="space-between">
        <UIText kind="small/regular">Slippage</UIText>
        <UIText kind="small/accent" color="var(--notice-500)">
          {formatPercent(slippage * 100, 'en')}%
        </UIText>
      </HStack>
      {outputAmount && price ? (
        <HStack gap={8} justifyContent="space-between">
          <UIText kind="small/regular">Minimum Received</UIText>
          <UIText kind="small/accent">
            {formatCurrencyValue(fiatValue, 'en', currency)}
          </UIText>
        </HStack>
      ) : null}
    </VStack>
  ) : null;
}

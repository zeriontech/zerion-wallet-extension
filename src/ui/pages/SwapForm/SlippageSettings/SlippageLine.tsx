import { useSelectorStore } from '@store-unit/react';
import type { SwapFormView } from '@zeriontech/transactions';
import BigNumber from 'bignumber.js';
import React from 'react';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { formatCurrencyValue } from 'src/shared/units/formatCurrencyValue';
import { formatPercent } from 'src/shared/units/formatPercent';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import type { Chain } from 'src/modules/networks/Chain';
import { getSlippageOptions } from './getSlippageOptions';

const HIGH_SLIPPAGE_THRESHOLD = 0.01; // 1%

export function SlippageLine({
  chain,
  swapView,
}: {
  chain: Chain;
  swapView: SwapFormView;
}) {
  const { currency } = useCurrency();
  const { receiveInput } = useSelectorStore(swapView.store, ['receiveInput']);
  const { slippage: userSlippage } = useSelectorStore(
    swapView.store.configuration,
    ['slippage']
  );

  const { slippage } = getSlippageOptions({
    chain,
    userSlippage,
  });

  const price = swapView.receiveAsset?.price?.value || 0;
  const fiatValue = new BigNumber(receiveInput || 0)
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
      {receiveInput && price ? (
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

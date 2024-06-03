import { useSelectorStore } from '@store-unit/react';
import type { SwapFormView } from '@zeriontech/transactions';
import BigNumber from 'bignumber.js';
import React from 'react';
import { formatCurrencyValue } from 'src/shared/units/formatCurrencyValue';
import { formatPercent } from 'src/shared/units/formatPercent/formatPercent';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';

const HIGH_SLIPPAGE_THRESHOLD = 0.01; // 1%

export function SlippageLine({ swapView }: { swapView: SwapFormView }) {
  const { receiveInput } = useSelectorStore(swapView.store, ['receiveInput']);
  const { slippage } = useSelectorStore(swapView.store.configuration, [
    'slippage',
  ]);

  const price = swapView.receiveAsset?.price?.value || 0;
  const fiatValue = new BigNumber(receiveInput || 0)
    .times(price)
    .times(1 - slippage);

  return slippage > HIGH_SLIPPAGE_THRESHOLD ? (
    <VStack gap={8}>
      <HStack gap={8} justifyContent="space-between">
        <UIText kind="small/regular" color="var(--neutral-700)">
          Slippage
        </UIText>
        <UIText kind="small/accent" color="var(--notice-500)">
          {formatPercent(slippage * 100, 'en')}%
        </UIText>
      </HStack>
      {receiveInput && price ? (
        <HStack gap={8} justifyContent="space-between">
          <UIText kind="small/regular" color="var(--neutral-700)">
            Minimum Received
          </UIText>
          <UIText kind="small/accent">
            {formatCurrencyValue(fiatValue, 'en', 'usd')}
          </UIText>
        </HStack>
      ) : null}
    </VStack>
  ) : null;
}

import React from 'react';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';

export function RiskDisclosureBlock() {
  return (
    <div
      style={{
        padding: '12px 16px',
        borderRadius: 24,
        backgroundColor: 'var(--neutral-100)',
      }}
    >
      <VStack gap={8}>
        <UIText kind="small/accent">Perpetuals Risk Disclosure</UIText>
        <UIText kind="caption/regular" color="var(--neutral-500)">
          Perpetual contracts are leveraged products that can result in losses
          exceeding your initial margin. Funding rates, liquidations, and
          extreme market conditions can rapidly impact your position. Trade
          responsibly and only with funds you can afford to lose.
        </UIText>
      </VStack>
    </div>
  );
}

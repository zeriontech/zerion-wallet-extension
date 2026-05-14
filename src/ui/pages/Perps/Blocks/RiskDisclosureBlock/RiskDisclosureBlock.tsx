import React from 'react';
import { Frame } from 'src/ui/ui-kit/Frame';
import { UIText } from 'src/ui/ui-kit/UIText';

export function RiskDisclosureBlock() {
  return (
    <Frame>
      <div style={{ padding: 16 }}>
        <UIText kind="caption/regular" color="var(--neutral-600)">
          Perpetual contracts are leveraged products that can result in losses
          exceeding your initial margin. Funding rates, liquidations, and
          extreme market conditions can rapidly impact your position. Trade
          responsibly and only with funds you can afford to lose.
        </UIText>
      </div>
    </Frame>
  );
}

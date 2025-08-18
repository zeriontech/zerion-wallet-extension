import React from 'react';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { formatTokenValue } from 'src/shared/units/formatTokenValue';
import type { ActionRate } from 'src/modules/zerion-api/requests/wallet-get-actions';

export function RateLine({ rate }: { rate: ActionRate }) {
  return (
    <HStack
      gap={24}
      alignItems="center"
      justifyContent="space-between"
      style={{ gridTemplateColumns: 'auto 1fr' }}
    >
      <UIText kind="small/regular">Rate</UIText>
      <UIText kind="small/accent" style={{ justifySelf: 'end' }}>
        {`${formatTokenValue(
          rate[0].value,
          rate[0].symbol
        )} = ${formatTokenValue(rate[1].value, rate[1].symbol)}`}
      </UIText>
    </HStack>
  );
}

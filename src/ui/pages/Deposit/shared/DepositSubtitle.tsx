import React from 'react';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { DEPOSIT_SUBTITLE } from './constants';

/**
 * The flow's one line of fixed copy, sitting at the same height on every step
 * it appears on. The floor is what does that: the token step hangs a 32px icon
 * button beside the text, so without it the form's bare 20px line would ride
 * higher and the sentence would jump as you moved between the two screens.
 */
export function DepositSubtitle({ end }: { end?: React.ReactNode }) {
  return (
    <HStack
      gap={8}
      alignItems="center"
      justifyContent="space-between"
      style={{
        gridTemplateColumns: end ? '1fr auto' : '1fr',
        minHeight: 32,
      }}
    >
      <UIText kind="small/regular" color="var(--neutral-500)">
        {DEPOSIT_SUBTITLE}
      </UIText>
      {end}
    </HStack>
  );
}

import React from 'react';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';

export function Address({
  address,
  padding = 4,
}: {
  address: string;
  padding?: number;
}) {
  const leadingPadding = address.startsWith('0x') ? 2 + padding : padding;
  const prefix = address.slice(0, leadingPadding);
  const infix = address.slice(leadingPadding, -padding);
  const suffix = address.slice(-padding);

  return (
    <HStack gap={0}>
      <UIText kind="small/accent">{prefix}</UIText>
      <UIText kind="small/regular" color="var(--neutral-500)">
        {infix}
      </UIText>
      <UIText kind="small/accent">{suffix}</UIText>
    </HStack>
  );
}

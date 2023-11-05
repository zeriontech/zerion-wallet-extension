import React from 'react';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';

export function ValueCell({ label, value }: { label: string; value: string }) {
  return (
    <VStack gap={4}>
      <UIText kind="small/accent" color="var(--neutral-500)">
        {label}
      </UIText>
      <UIText kind="body/accent">{value}</UIText>
    </VStack>
  );
}

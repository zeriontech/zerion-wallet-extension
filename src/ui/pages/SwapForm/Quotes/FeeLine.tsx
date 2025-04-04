import React from 'react';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';

export function FeeLine({ fee }: { fee?: number }) {
  return (
    <HStack
      gap={8}
      justifyContent="space-between"
      style={{ display: fee !== 0 ? 'none' : 'grid' }}
    >
      <UIText kind="small/regular">Zerion Fee</UIText>
      <UIText kind="small/accent">Free</UIText>
    </HStack>
  );
}

import React from 'react';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';

export function ViewError({ error }: { error?: Error | null }) {
  return (
    <VStack
      gap={8}
      style={{ textAlign: 'center', paddingLeft: 8, paddingRight: 8 }}
    >
      <UIText kind="h/2_med">Oops</UIText>
      <UIText kind="subtitle/m_reg" color="var(--neutral-500)">
        Things break. Life goes on.
      </UIText>
      <UIText kind="subtitle/s_reg">
        {error?.message || "We crashed. And don't know why"}
      </UIText>
    </VStack>
  );
}

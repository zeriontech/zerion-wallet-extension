import React from 'react';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';

export function ViewError({
  title = 'Oops',
  subtitle = 'Things break. Life goes on.',
  error,
}: {
  title?: string;
  subtitle?: string | null;
  error?: Error | null;
}) {
  return (
    <VStack
      gap={8}
      style={{ textAlign: 'center', paddingLeft: 8, paddingRight: 8 }}
    >
      <UIText kind="h/2_med">{title}</UIText>
      {subtitle ? (
        <UIText kind="subtitle/m_reg" color="var(--neutral-500)">
          {subtitle}
        </UIText>
      ) : null}
      <UIText kind="subtitle/s_reg">
        {error?.message || "We crashed. And don't know why"}
      </UIText>
    </VStack>
  );
}

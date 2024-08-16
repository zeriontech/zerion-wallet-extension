import React from 'react';
import { FillView } from 'src/ui/components/FillView';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';

export function EmptyView({
  emoji = '🥺',
  children,
}: {
  emoji?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <FillView>
      <VStack gap={6} style={{ textAlign: 'center' }}>
        <UIText kind="headline/hero">{emoji}</UIText>
        <UIText kind="small/accent" color="var(--neutral-500)">
          {children}
        </UIText>
      </VStack>
    </FillView>
  );
}

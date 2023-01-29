import React from 'react';
import { FillView } from 'src/ui/components/FillView';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';

export function ViewEmpty({
  emoji = '🥺',
  text,
}: {
  emoji?: string;
  text: string;
}) {
  return (
    <FillView>
      <VStack gap={6} style={{ textAlign: 'center' }}>
        <UIText kind="h/1_reg">{emoji}</UIText>
        <UIText kind="subtitle/l_reg" color="var(--neutral-500)">
          {text}
        </UIText>
      </VStack>
    </FillView>
  );
}

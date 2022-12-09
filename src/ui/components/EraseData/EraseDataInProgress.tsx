import React from 'react';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { FillView } from '../FillView';

export function EraseDataInProgress() {
  return (
    <FillView>
      <VStack gap={8} style={{ justifyItems: 'center' }}>
        <CircleSpinner color="var(--primary)" size="24px" />
        <UIText kind="body/regular">Clearing data…</UIText>
      </VStack>
    </FillView>
  );
}

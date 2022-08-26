import React from 'react';
import { Button } from 'src/ui/ui-kit/Button';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';

export function GenericPrompt({ message }: { message: string }) {
  return (
    <form
      method="dialog"
      style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
    >
      <VStack gap={8}>
        <UIText kind="subtitle/l_med">Are you sure?</UIText>
        <UIText kind="body/s_reg">{message}</UIText>
      </VStack>
      <HStack gap={12} style={{ marginTop: 'auto' }}>
        <Button value="cancel" kind="regular">
          Cancel
        </Button>
        <Button value="confirm">Yes</Button>
      </HStack>
    </form>
  );
}

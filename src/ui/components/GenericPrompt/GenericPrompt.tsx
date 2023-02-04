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
        <UIText kind="headline/h3">Are you sure?</UIText>
        <UIText kind="body/regular">{message}</UIText>
      </VStack>
      <HStack
        gap={12}
        style={{ marginTop: 'auto', gridAutoColumns: '1fr 1fr' }}
      >
        <Button value="cancel" kind="regular">
          Cancel
        </Button>
        <Button value="confirm">Yes</Button>
      </HStack>
    </form>
  );
}

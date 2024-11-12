import React from 'react';
import { Button } from 'src/ui/ui-kit/Button';
import { HStack } from 'src/ui/ui-kit/HStack';
import { DialogTitle } from 'src/ui/ui-kit/ModalDialogs/DialogTitle';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';

export function ExitConfirmationDialog({
  onCancel,
  onExit,
}: {
  onCancel: () => void;
  onExit: () => void;
}) {
  return (
    <VStack gap={24}>
      <DialogTitle
        alignTitle="start"
        title={<UIText kind="headline/h3">Do you want to exit?</UIText>}
        closeKind="icon"
      />
      <UIText kind="body/regular" color="var(--neutral-700)">
        You can resume claiming your XP whenever you're ready
      </UIText>
      <HStack gap={8} style={{ gridTemplateColumns: '1fr 1fr' }}>
        <Button kind="regular" type="button" onClick={onCancel}>
          Back
        </Button>
        <Button kind="primary" onClick={onExit} value="cancel">
          Exit
        </Button>
      </HStack>
    </VStack>
  );
}

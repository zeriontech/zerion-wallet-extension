import React, { useEffect, useState } from 'react';
import { Button } from 'src/ui/ui-kit/Button';
import { HStack } from 'src/ui/ui-kit/HStack';
import { BottomSheetDialog } from 'src/ui/ui-kit/ModalDialogs/BottomSheetDialog';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { Toggle } from 'src/ui/ui-kit/Toggle';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { WarningIcon } from '../WarningIcon';

function ResetWarningForm() {
  return (
    <VStack gap={8}>
      <form method="dialog">
        <VStack gap={8}>
          <WarningIcon
            size={44}
            outlineStrokeWidth={7}
            borderWidth="3px"
            kind="negative"
            glow={true}
          />
          <UIText kind="headline/h3">
            Erase data for the browser extension?
          </UIText>
          <UIText kind="body/regular">
            Your crypto assets remain secured on the blockchain and can be
            accessed with your private keys and recovery phrase
          </UIText>
        </VStack>
        <Spacer height={28} />
        <label>
          <HStack gap={12} justifyContent="space-between" alignItems="center">
            <UIText kind="body/regular">Yes, erase my data</UIText>
            <Toggle defaultChecked={false} required={true} />
          </HStack>
        </label>
        <Spacer height={16} />
        <Button kind="danger" value="confirm" style={{ width: '100%' }}>
          Erase My Data
        </Button>
      </form>
      <form method="dialog">
        <Button kind="regular" value="cancel" style={{ width: '100%' }}>
          Back
        </Button>
      </form>
    </VStack>
  );
}

export const EraseDataConfirmationDialog = React.forwardRef(
  (_props, ref: React.Ref<HTMLDialogElementInterface>) => {
    const [key, setKey] = useState(1);
    useEffect(() => {
      const dialog = ref && 'current' in ref ? ref.current : null;
      if (dialog) {
        // reset form state when dialog closes
        const handler = () => setKey((n) => n + 1);
        dialog.addEventListener('close', handler);
        dialog.addEventListener('cancel', handler);
        return () => {
          dialog.removeEventListener('close', handler);
          dialog.removeEventListener('cancel', handler);
        };
      }
    }, [ref]);
    return (
      <BottomSheetDialog
        style={{ height: 'max-content', minHeight: '48vh' }}
        ref={ref}
      >
        <ResetWarningForm key={key} />
      </BottomSheetDialog>
    );
  }
);

import React, { useEffect, useId, useState } from 'react';
import { Button } from 'src/ui/ui-kit/Button';
import { Input } from 'src/ui/ui-kit/Input';
import { BottomSheetDialog } from 'src/ui/ui-kit/ModalDialogs/BottomSheetDialog';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { WarningIcon } from '../WarningIcon';

const ERASE_CONFIRMATION = 'ERASE';

function ResetWarningForm() {
  const inputId = useId();
  const [confirmation, setConfirmation] = useState('');
  const isConfirmed = confirmation === ERASE_CONFIRMATION;

  return (
    <VStack gap={8}>
      <form
        method="dialog"
        onSubmit={(event) => {
          if (!isConfirmed) {
            event.preventDefault();
          }
        }}
      >
        <VStack gap={8}>
          <WarningIcon
            size={44}
            outlineStrokeWidth={7}
            borderWidth="3px"
            kind="negative"
            glow={true}
          />
          <UIText kind="headline/h3">Erase data for the browser extension?</UIText>
          <UIText kind="body/regular">
            Every wallet in the browser extension will be erased and can only be restored from your
            recovery phrase or a backup. Your crypto assets remain secured on the blockchain.
          </UIText>
        </VStack>
        <Spacer height={28} />
        <VStack gap={8}>
          <UIText as="label" htmlFor={inputId} kind="body/regular">
            Type ERASE to confirm
          </UIText>
          <Input
            id={inputId}
            name="erase-confirmation"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            placeholder={ERASE_CONFIRMATION}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="characters"
            spellCheck={false}
            autoFocus={true}
          />
        </VStack>
        <Spacer height={16} />
        <Button kind="danger" value="confirm" disabled={!isConfirmed} style={{ width: '100%' }}>
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
  (_props, ref: React.Ref<HTMLDialogElement>) => {
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
      <BottomSheetDialog style={{ height: 'max-content', minHeight: '48vh' }} ref={ref}>
        <ResetWarningForm key={key} />
      </BottomSheetDialog>
    );
  },
);

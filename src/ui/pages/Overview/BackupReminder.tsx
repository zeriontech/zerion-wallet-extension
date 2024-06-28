import React, { useLayoutEffect, useRef } from 'react';
import {
  BottomSheetDialog,
  DialogAnimationPreset,
} from 'src/ui/ui-kit/ModalDialogs/BottomSheetDialog';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { VStack } from 'src/ui/ui-kit/VStack';
import { WarningIcon } from 'src/ui/components/WarningIcon';
import { UIText } from 'src/ui/ui-kit/UIText';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Button } from 'src/ui/ui-kit/Button';
import { usePreferences } from 'src/ui/features/preferences';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import { apostrophe } from 'src/ui/shared/typography';
import { useEvent } from 'src/ui/shared/useEvent';
import { useBackupTodosCount } from 'src/ui/shared/requests/useBackupTodosCount';

const ONE_DAY = 1000 * 60 * 60 * 24;

function BackupReminderComponent({ onDismiss }: { onDismiss: () => void }) {
  const dialogRef = useRef<HTMLDialogElementInterface | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  useLayoutEffect(() => {
    if (dialogRef.current) {
      dialogRef.current.showModal();
      // hide initial outline on cancel button to provide correct look
      buttonRef.current?.blur();
    }
  }, []);

  const handleHide = useEvent(() => {
    onDismiss();
    dialogRef.current?.close();
  });

  return (
    <BottomSheetDialog
      ref={dialogRef}
      height="fit-content"
      onClosed={handleHide}
      closeOnClickOutside={false}
      animationPreset={DialogAnimationPreset.slideUpNoFadeIn}
    >
      <VStack gap={32}>
        <VStack gap={16}>
          <WarningIcon
            size={44}
            outlineStrokeWidth={7}
            borderWidth="3px"
            kind="notice"
            glow={true}
          />
          <VStack gap={8}>
            <UIText kind="headline/h3">Secure your wallet</UIText>
            <UIText kind="body/regular">
              If this device is lost or stolen, you{apostrophe}ll lose access to
              your wallet and funds
            </UIText>
          </VStack>
        </VStack>
        <HStack
          gap={12}
          justifyContent="center"
          style={{ marginTop: 'auto', gridTemplateColumns: '1fr 1fr' }}
        >
          <Button
            onClick={handleHide}
            kind="regular"
            style={{ whiteSpace: 'nowrap', paddingInline: 24 }}
            ref={buttonRef}
            size={48}
          >
            <UIText kind="body/accent">I{apostrophe}ll take the risk</UIText>
          </Button>
          <Button
            onClick={handleHide}
            as={UnstyledLink}
            to="/settings"
            kind="primary"
            style={{ whiteSpace: 'nowrap', paddingInline: 24 }}
            size={48}
          >
            <UIText kind="body/accent">Backup (~1 min)</UIText>
          </Button>
        </HStack>
      </VStack>
    </BottomSheetDialog>
  );
}

export function BackupReminder() {
  const count = useBackupTodosCount();
  const { preferences, setPreferences } = usePreferences();

  const showDialog =
    count &&
    preferences &&
    Date.now() - preferences.backupReminderDismissedTime >= ONE_DAY;

  return showDialog ? (
    <BackupReminderComponent
      onDismiss={() =>
        setPreferences({ backupReminderDismissedTime: Date.now() })
      }
    />
  ) : null;
}

import React, { useCallback, useEffect, useRef } from 'react';
import { BottomSheetDialog } from 'src/ui/ui-kit/ModalDialogs/BottomSheetDialog';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { VStack } from 'src/ui/ui-kit/VStack';
import { WarningIcon } from 'src/ui/components/WarningIcon';
import { UIText } from 'src/ui/ui-kit/UIText';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Button } from 'src/ui/ui-kit/Button';
import { usePreferences } from 'src/ui/features/preferences';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import { useBackupTodosCount } from '../BackupWallet/useBackupTodosCount';

// 2 mins break for testing purpose
const ONE_DAY = 1000 * 60 * 2; // 1000 * 60 * 60 * 24;

export function BackupReminder() {
  const count = useBackupTodosCount();
  const dialogRef = useRef<HTMLDialogElementInterface | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const { preferences, setPreferences } = usePreferences();

  useEffect(() => {
    if (
      dialogRef.current &&
      count &&
      preferences &&
      Date.now() - preferences.lastBackupReminderHideTime >= ONE_DAY
    ) {
      dialogRef.current.showModal();
      // hide initial outline on cancel button to provide correct look
      buttonRef.current?.blur();
    }
  }, [count, preferences]);

  const handleHide = useCallback(() => {
    setPreferences({ lastBackupReminderHideTime: Date.now() });
    dialogRef.current?.close();
  }, [setPreferences]);

  return (
    <BottomSheetDialog
      ref={dialogRef}
      height="fit-content"
      onClosed={handleHide}
      closeOnClickOutside={false}
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
              If this device is lost or stolen, you'll lose access to your
              wallet and funds
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
            <UIText kind="body/accent">I'll take the risk</UIText>
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

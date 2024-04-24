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
      Date.now() - preferences.backupReminderCloseTime >= ONE_DAY
    ) {
      dialogRef.current.showModal();
      // hide initial outline on cancel button to provide correct look
      buttonRef.current?.blur();
    }
  }, [count, preferences]);

  const handleHide = useCallback(() => {
    setPreferences({ backupReminderCloseTime: Date.now() });
    dialogRef.current?.close();
  }, [setPreferences]);

  return (
    <BottomSheetDialog
      ref={dialogRef}
      height="fit-content"
      onClosed={handleHide}
    >
      <VStack gap={24}>
        <VStack gap={8}>
          <WarningIcon
            size={44}
            outlineStrokeWidth={7}
            borderWidth="3px"
            kind="notice"
            glow={true}
          />
          <UIText kind="headline/h3">Secure your wallet</UIText>
          <UIText kind="body/regular">
            If this devide is lost or stolen, you'll lose access to your wallet
            and funds
          </UIText>
        </VStack>
        <HStack
          gap={12}
          justifyContent="center"
          style={{ marginTop: 'auto', gridTemplateColumns: '1fr 1fr' }}
        >
          <Button
            onClick={handleHide}
            kind="regular"
            style={{ whiteSpace: 'nowrap' }}
            ref={buttonRef}
          >
            I'll take the risk
          </Button>
          <Button
            onClick={handleHide}
            as={UnstyledLink}
            to="/settings"
            kind="primary"
            style={{ whiteSpace: 'nowrap' }}
          >
            Backup (~1 min)
          </Button>
        </HStack>
      </VStack>
    </BottomSheetDialog>
  );
}

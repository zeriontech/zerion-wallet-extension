import React, { useRef } from 'react';
import type { LedgerError } from '@zeriontech/hardware-wallet-connection';
import { DialogTitle } from 'src/ui/ui-kit/ModalDialogs/DialogTitle';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { Button } from 'src/ui/ui-kit/Button';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { CenteredDialog } from 'src/ui/ui-kit/ModalDialogs/CenteredDialog';

export function TroubleshootingDialog({
  error,
}: {
  error: LedgerError | null;
}) {
  const dialogRef = useRef<HTMLDialogElementInterface | null>(null);

  return (
    <>
      <Button
        kind="regular"
        onClick={() => {
          dialogRef.current?.showModal();
        }}
        style={{ paddingInline: 24 }}
      >
        Troubleshooting
      </Button>
      <CenteredDialog ref={dialogRef}>
        <DialogTitle alignTitle="start" title="Troubleshooting" />
        <Spacer height={24} />
        <VStack gap={16}>
          <UIText kind="body/regular">
            If you're experiencing issues with your Ledger device, try the
            following steps:
          </UIText>
          <UIText
            kind="small/regular"
            style={{
              padding: '16px 32px',
              borderRadius: 8,
              backgroundColor: 'var(--neutral-100)',
            }}
          >
            There is most likely another unfinished operation in progress
          </UIText>
          <ul
            style={{
              listStyle: 'disc',
              paddingLeft: 20,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <li>
              <UIText kind="small/regular">
                Unlock the device and close all apps
              </UIText>
            </li>
            <li>
              <UIText kind="small/regular">
                Check if other apps on your computer are using the device
              </UIText>
            </li>
            <li>
              <UIText kind="small/regular">Reconnect the device</UIText>
            </li>
            <li>
              <UIText kind="small/regular">Restart the device</UIText>
            </li>
            <li>
              <UIText kind="small/regular">
                Update the firmware to the latest version
              </UIText>
            </li>
          </ul>
          <Spacer height={8} />
          <UIText kind="body/regular">
            If the problem persists, you can submit a report to help us improve.
          </UIText>
          {error ? (
            <Button
              kind="primary"
              onClick={() => {
                // TODO: Implement submit report logic
              }}
            >
              Submit Report
            </Button>
          ) : null}
        </VStack>
        <Spacer height={24} />
      </CenteredDialog>
    </>
  );
}

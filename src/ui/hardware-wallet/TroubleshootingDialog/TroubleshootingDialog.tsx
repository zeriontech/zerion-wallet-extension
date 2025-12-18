import React, { useRef } from 'react';
import type { LedgerError } from '@zeriontech/hardware-wallet-connection';
import { DialogTitle } from 'src/ui/ui-kit/ModalDialogs/DialogTitle';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { Button } from 'src/ui/ui-kit/Button';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { BottomSheetDialog } from 'src/ui/ui-kit/ModalDialogs/BottomSheetDialog';
import { useMutation } from '@tanstack/react-query';
import { walletPort } from 'src/ui/shared/channels';

export function TroubleshootingDialog({
  error,
}: {
  error: LedgerError | null;
}) {
  const dialogRef = useRef<HTMLDialogElementInterface | null>(null);
  const reportMutation = useMutation({
    mutationFn: async () => {
      return walletPort.request('reportLedgerError', {
        errorMessage: error?.toString() || 'Unknown Ledger error',
      });
    },
  });

  return (
    <>
      <Button
        kind="text-primary"
        onClick={() => {
          dialogRef.current?.showModal();
        }}
      >
        Troubleshooting
      </Button>
      <BottomSheetDialog ref={dialogRef} height="fit-content">
        <DialogTitle alignTitle="start" title="Troubleshooting" />
        <Spacer height={24} />
        <VStack gap={16} style={{ textAlign: 'left' }}>
          <UIText kind="body/regular">
            If you're experiencing issues with your Ledger device, try the
            following steps:
          </UIText>
          <UIText
            kind="small/regular"
            style={{
              padding: '12px 16px',
              borderRadius: 8,
              backgroundColor: 'var(--neutral-100)',
            }}
          >
            There is most likely another unfinished operation in progress. Or
            device is already connected via usb to another app or window of this
            extension
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
            reportMutation.isIdle || reportMutation.isLoading ? (
              <Button
                kind="primary"
                onClick={() => reportMutation.mutate()}
                disabled={reportMutation.isLoading}
              >
                Submit Report
              </Button>
            ) : (
              <UIText kind="body/regular">Report submitted. Thank you!</UIText>
            )
          ) : null}
        </VStack>
      </BottomSheetDialog>
    </>
  );
}

import React, { useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from 'react-query';
import { PageBottom } from 'src/ui/components/PageBottom';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageHeading } from 'src/ui/components/PageHeading';
import { PageTop } from 'src/ui/components/PageTop';
import { Button } from 'src/ui/ui-kit/Button';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { VStack } from 'src/ui/ui-kit/VStack';
import * as s from 'src/ui/style/helpers.module.css';
import { BottomSheetDialog } from 'src/ui/ui-kit/ModalDialogs/BottomSheetDialog';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { showConfirmDialog } from 'src/ui/ui-kit/ModalDialogs/showConfirmDialog';
import { invariant } from 'src/shared/invariant';
import { DialogTitle } from 'src/ui/ui-kit/ModalDialogs/DialogTitle';
import { WarningIcon } from 'src/ui/components/WarningIcon';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { accountPublicRPCPort } from 'src/ui/shared/channels';
import { focusNode } from 'src/ui/shared/focusNode';
import { FillView } from 'src/ui/components/FillView';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';

function ResetWarningForm() {
  return (
    <form method="dialog">
      <VStack gap={8}>
        <WarningIcon kind="negative" glow={true} />
        <UIText kind="headline/h3">
          Reset data for the browser extension?
        </UIText>
        <UIText kind="body/regular">
          Your crypto assets remain secured on the blockchain and can be
          accessed with your private keys and recovery phrase
        </UIText>
      </VStack>
      <Spacer height={32} />
      <Button kind="danger" value="confirm" style={{ width: '100%' }}>
        Yes, Clear My Data
      </Button>
    </form>
  );
}

export function ForgotPassword() {
  const navigate = useNavigate();
  const dialogRef = useRef<HTMLDialogElementInterface | null>(null);
  const eraseAllData = useMutation(
    async () => {
      // artificial delay
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return accountPublicRPCPort.request('eraseAllData');
    },
    {
      onSuccess() {
        navigate('/');
      },
    }
  );
  if (eraseAllData.isSuccess) {
    return null; // avoid flickering while waiting for navigation
  }
  if (eraseAllData.isLoading) {
    return (
      <FillView>
        <VStack gap={8} style={{ justifyItems: 'center' }}>
          <CircleSpinner color="var(--primary)" size="24px" />
          <UIText kind="body/regular">Clearing data...</UIText>
        </VStack>
      </FillView>
    );
  }
  return (
    <>
      <BottomSheetDialog height="48vh" ref={dialogRef}>
        <DialogTitle title={null} />
        <ResetWarningForm />
      </BottomSheetDialog>
      <PageColumn>
        <PageTop />
        <PageHeading>Forgot your password?</PageHeading>
        <VStack gap={16} style={{ marginTop: 'auto' }}>
          <Button ref={focusNode} kind="primary" as={Link} to="/login">
            Try Password Again
          </Button>
          <UIText kind="body/accent" color="var(--neutral-500)">
            <UnstyledButton
              style={{ width: '100%' }}
              className={s.hoverUnderline}
              disabled={eraseAllData.isLoading}
              onClick={() => {
                invariant(dialogRef.current, 'dialog element must be mounted');
                showConfirmDialog(dialogRef.current).then(() => {
                  eraseAllData.mutate();
                });
              }}
            >
              Clear All Data
            </UnstyledButton>
          </UIText>
        </VStack>
        <PageBottom />
      </PageColumn>
    </>
  );
}

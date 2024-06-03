import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { PageBottom } from 'src/ui/components/PageBottom';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageHeading } from 'src/ui/components/PageHeading';
import { PageTop } from 'src/ui/components/PageTop';
import { Button } from 'src/ui/ui-kit/Button';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { VStack } from 'src/ui/ui-kit/VStack';
import * as helperStyles from 'src/ui/style/helpers.module.css';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { showConfirmDialog } from 'src/ui/ui-kit/ModalDialogs/showConfirmDialog';
import { invariant } from 'src/shared/invariant';
import { focusNode } from 'src/ui/shared/focusNode';
import { useEraseDataMutation } from 'src/ui/components/EraseData';
import { EraseDataConfirmationDialog } from 'src/ui/components/EraseData';
import { EraseDataInProgress } from 'src/ui/components/EraseData';
import { maybeOpenOboarding } from 'src/ui/Onboarding/initialization';
import { templateData } from 'src/ui/shared/getPageTemplateName';
import { emitter } from 'src/ui/shared/events';
import * as s from './styles.module.css';

export function ForgotPassword() {
  const dialogRef = useRef<HTMLDialogElementInterface | null>(null);
  const eraseAllData = useEraseDataMutation({
    onSuccess: () => {
      if (templateData.windowContext === 'tab') {
        emitter.emit('reloadExtension');
      } else {
        maybeOpenOboarding();
      }
    },
  });
  if (eraseAllData.isSuccess) {
    return null; // avoid flickering while waiting for navigation
  }
  if (eraseAllData.isLoading) {
    return <EraseDataInProgress />;
  }
  return (
    <>
      <EraseDataConfirmationDialog ref={dialogRef} />
      <PageColumn>
        <PageTop />
        <PageHeading>Forgot your password?</PageHeading>
        <UIText
          // this will style the <ol> counters
          kind="small/accent"
        >
          <ol className={s.styledOl}>
            <li>
              <UIText inline={true} kind="body/regular">
                <strong style={{ fontWeight: 500 }}>
                  We’re unable to recover the password
                </strong>{' '}
                for you because it’s stored securely and locally only on your
                computer. Try entering the correct password again.
              </UIText>
            </li>
            <li>
              <UIText inline={true} kind="body/regular">
                Alternatively, you can create a new account and password by
                deleting your data and import your wallets again with the
                recovery phrase or private keys.
              </UIText>
            </li>
          </ol>
        </UIText>
        <VStack gap={16} style={{ marginTop: 'auto' }}>
          <Button ref={focusNode} kind="primary" as={Link} to="/login">
            Try Password Again
          </Button>
          <UIText kind="body/accent" color="var(--neutral-500)">
            <UnstyledButton
              style={{ width: '100%' }}
              className={helperStyles.hoverUnderline}
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

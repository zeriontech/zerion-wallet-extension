import React from 'react';
import { useLocation } from 'react-router-dom';
import type { ExternallyOwnedAccount } from 'src/shared/types/ExternallyOwnedAccount';
import { Button } from 'src/ui/ui-kit/Button';
import { Dialog2, useDialog2 } from 'src/ui/ui-kit/ModalDialogs/Dialog2';
import { UIText } from 'src/ui/ui-kit/UIText';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import { focusNode } from 'src/ui/shared/focusNode';
import { emitter } from 'src/ui/shared/events';

export function ReadonlySignButton({
  wallet,
}: {
  wallet: ExternallyOwnedAccount;
}) {
  const { pathname } = useLocation();
  const { open, openDialog, closeDialog } = useDialog2();

  return (
    <>
      <Button
        kind="primary"
        onClick={() => {
          emitter.emit('buttonClicked', {
            buttonName: 'Import Wallet',
            buttonScope: 'General',
            pathname,
            walletAddress: wallet.address,
          });
          openDialog();
        }}
        style={{
          width: '100%',
          height: 52,
          borderRadius: 16,
          paddingInline: 24,
        }}
      >
        Import Wallet
      </Button>
      <Dialog2
        open={open}
        onClose={closeDialog}
        title="Import Wallet"
        size="content"
      >
        <div style={{ padding: 16 }}>
          <UIText kind="body/regular">
            To perform transactions, import your wallet using your private keys
            or recovery phrase.
          </UIText>
          <Spacer height={24} />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 8,
            }}
          >
            <Button kind="regular" onClick={closeDialog} ref={focusNode}>
              Cancel
            </Button>
            <Button kind="primary" as={UnstyledLink} to="/get-started">
              Import Wallet
            </Button>
          </div>
        </div>
      </Dialog2>
    </>
  );
}

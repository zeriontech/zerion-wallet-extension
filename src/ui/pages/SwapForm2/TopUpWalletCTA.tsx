import React, { Suspense } from 'react';
import { useLocation } from 'react-router-dom';
import type { ExternallyOwnedAccount } from 'src/shared/types/ExternallyOwnedAccount';
import { Button } from 'src/ui/ui-kit/Button';
import { Dialog2, useDialog2 } from 'src/ui/ui-kit/ModalDialogs/Dialog2';
import { emitter } from 'src/ui/shared/events';
import { AddFundsOptionsContent } from '../Receive/AddFundsOptionsDialog';

export function TopUpWalletCTA({ wallet }: { wallet: ExternallyOwnedAccount }) {
  const { pathname } = useLocation();
  const { open, openDialog, closeDialog } = useDialog2();

  return (
    <>
      <Button
        kind="primary"
        onClick={() => {
          emitter.emit('buttonClicked', {
            buttonName: 'Top Up Your Wallet',
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
        Top Up Your Wallet
      </Button>
      <Dialog2
        open={open}
        onClose={closeDialog}
        title="Add Funds"
        size="content"
      >
        <div style={{ padding: 16 }}>
          <Suspense fallback={null}>
            <AddFundsOptionsContent
              wallet={wallet}
              analytics={{ pathname, address: wallet.address }}
            />
          </Suspense>
        </div>
      </Dialog2>
    </>
  );
}

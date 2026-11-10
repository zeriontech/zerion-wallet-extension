import React, { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BottomSheetDialog } from 'src/ui/ui-kit/ModalDialogs/BottomSheetDialog';
import { DialogTitle } from 'src/ui/ui-kit/ModalDialogs/DialogTitle';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { Button } from 'src/ui/ui-kit/Button';
import { focusNode } from 'src/ui/shared/focusNode';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import { UIText } from 'src/ui/ui-kit/UIText';
import { getWalletGroupByAddress } from 'src/ui/shared/requests/getWalletGroupByAddress';
import { isReadonlyContainer } from 'src/shared/types/validators';
import { invariant } from 'src/shared/invariant';

const ReadonlyWarningDialog = React.forwardRef<
  HTMLDialogElement,
  object // later can describe Props
>((_props, ref) => {
  return (
    <BottomSheetDialog
      ref={ref}
      containerStyle={{ padding: 16 }}
      height="fit-content"
      renderWhenOpen={() => (
        <div style={{ textAlign: 'start' }}>
          <UIText kind="headline/h3">
            <DialogTitle title="Import Wallet" alignTitle="start" closeKind="icon" />
          </UIText>
          <Spacer height={16} />
          <div>
            To perform transactions, import your wallet using your private keys or recovery phrase.
          </div>
          <Spacer height={24} />
          <form
            method="dialog"
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 8,
            }}
          >
            <Button kind="regular" ref={focusNode}>
              Cancel
            </Button>
            <Button kind="primary" to="/get-started" as={UnstyledLink}>
              Import Wallet
            </Button>
          </form>
        </div>
      )}
    />
  );
});

export function WithReadonlyWarningDialog({
  address,
  onClick,
  render,
}: {
  address: string;
  onClick?: () => void;
  render: (props: {
    handleClick: (event: React.MouseEvent<HTMLButtonElement> | null) => void;
  }) => React.ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const { data: walletGroup } = useQuery({
    queryKey: ['getWalletGroupByAddress', address],
    queryFn: () => getWalletGroupByAddress(address),
  });
  const isReadonlyGroup = walletGroup ? isReadonlyContainer(walletGroup.walletContainer) : null;
  return (
    <>
      {isReadonlyGroup ? <ReadonlyWarningDialog ref={dialogRef} /> : null}
      {render({
        handleClick: (event) => {
          if (isReadonlyGroup) {
            invariant(dialogRef.current, 'Dialog not mounted');
            event?.preventDefault();
            dialogRef.current.showModal();
          } else {
            onClick?.();
          }
        },
      })}
    </>
  );
}

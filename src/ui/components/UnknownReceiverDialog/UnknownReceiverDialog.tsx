import React from 'react';
import type { AnyAddressAction } from 'src/modules/ethereum/transactions/addressAction';
import type { NetworkInfo } from 'src/modules/networks/NetworkInfo';
import { AddToAddressBookDialog } from 'src/ui/components/AddToAddressBookDialog';
import { ActInfo } from 'src/ui/components/address-action/ActInfo';
import { AngleRightRow } from 'src/ui/components/AngleRightRow';
import { useAddressBook } from 'src/ui/features/address-book';
import type { WarningContent } from 'src/ui/pages/SwapForm2/TransactionWarning';
import { TransactionWarning } from 'src/ui/pages/SwapForm2/TransactionWarning';
import { focusNode } from 'src/ui/shared/focusNode';
import { Button } from 'src/ui/ui-kit/Button';
import { Frame } from 'src/ui/ui-kit/Frame';
import { FrameListItemButton } from 'src/ui/ui-kit/FrameList';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Dialog2, useDialog2 } from 'src/ui/ui-kit/ModalDialogs/Dialog2';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import PersonAddIcon from 'jsx:src/ui/assets/person-add.svg';
import PersonSuccessIcon from 'jsx:src/ui/assets/person-success.svg';
import { ReceiverAddressBlock } from './ReceiverAddressBlock';

function DialogContent({
  senderAddress,
  receiverAddress,
  network,
  addressAction,
  warning,
  onCancel,
  onConfirm,
}: {
  senderAddress: string;
  receiverAddress: string;
  network: NetworkInfo | null;
  addressAction: AnyAddressAction | null;
  warning: WarningContent | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const addToBookDialog = useDialog2();
  const { upsert, find } = useAddressBook();
  const savedEntry = find(receiverAddress);

  // No detail rows when the Simulation didn't come back — the local
  // send-address-action fallback would be our own guess about the very thing
  // the user is being asked to verify.
  const acts = addressAction?.acts ?? [];

  return (
    <>
      <VStack gap={20} style={{ padding: 24 }}>
        <VStack gap={8} style={{ justifyItems: 'center', textAlign: 'center' }}>
          <UIText kind="headline/h3">Sending to a new address</UIText>
          <UIText kind="small/accent" color="var(--neutral-500)">
            This address isn’t saved in your wallets or Address Book
          </UIText>
        </VStack>
        <VStack
          gap={4}
          style={{
            // The detail blocks sit 12px from the dialog edge while everything
            // else keeps the dialog's 24px padding, so they read as one framed
            // group rather than another paragraph.
            // marginInline: -12,
            ['--surface-background-color' as string]: 'var(--neutral-100)',
            ['--act-info-padding-inline' as string]: '8px',
          }}
        >
          <ReceiverAddressBlock address={receiverAddress} network={network} />
          {acts.map((act, index) => (
            <ActInfo
              key={index}
              address={senderAddress}
              act={act}
              elementEnd={null}
              initialDelay={300 * index}
            />
          ))}
        </VStack>
        <TransactionWarning warning={warning} />
        {/* Framed like a Settings row, and a whole gap away from the button
            row, so it can't be mistaken for a third choice alongside
            Cancel and Send. */}
        <Frame>
          {savedEntry ? (
            // A plain padded row, not a FrameListItem: the saved state is not
            // interactive and FrameListItem highlights on hover.
            <HStack gap={8} alignItems="center" style={{ padding: 12 }}>
              <PersonSuccessIcon
                style={{ width: 20, height: 20, color: 'var(--positive-500)' }}
              />
              <UIText kind="body/regular" color="var(--positive-500)">
                {savedEntry.name
                  ? `Saved as ${savedEntry.name}`
                  : 'Saved to Address Book'}
              </UIText>
            </HStack>
          ) : (
            <FrameListItemButton onClick={addToBookDialog.openDialog}>
              <AngleRightRow>
                <HStack gap={8} alignItems="center">
                  <PersonAddIcon style={{ width: 20, height: 20 }} />
                  <UIText kind="body/regular">Add to Address Book</UIText>
                </HStack>
              </AngleRightRow>
            </FrameListItemButton>
          )}
        </Frame>
        <HStack
          gap={8}
          style={{ gridAutoColumns: '1fr', gridAutoFlow: 'column' }}
        >
          <Button kind="regular" onClick={onCancel} ref={focusNode}>
            Cancel
          </Button>
          <Button
            kind={warning ? 'danger' : 'primary'}
            onClick={onConfirm}
            style={{ paddingInline: 0 }}
          >
            {warning ? 'Send Anyway' : 'Send'}
          </Button>
        </HStack>
      </VStack>
      <AddToAddressBookDialog
        open={addToBookDialog.open}
        onClose={addToBookDialog.closeDialog}
        address={receiverAddress}
        onSubmit={(entry) => {
          upsert(entry);
          addToBookDialog.closeDialog();
        }}
      />
    </>
  );
}

/**
 * Last-chance confirmation before signing a Send to an **Unknown receiver**.
 * Shows the interpreted Address Action next to the untruncated receiver
 * address and offers to save that address to the Address Book — saving is the
 * only way to stop being asked, so it doubles as the opt-out.
 *
 * `open` is owned by the caller and never derived from the receiver's
 * familiarity: saving to the Address Book flips the receiver to "known" while
 * the dialog is still up, and a derived `open` would make it vanish
 * mid-interaction.
 */
export function UnknownReceiverDialog({
  open,
  onClose,
  senderAddress,
  receiverAddress,
  network,
  addressAction,
  warning,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  senderAddress: string;
  receiverAddress: string;
  network: NetworkInfo | null;
  addressAction: AnyAddressAction | null;
  warning: WarningContent | null;
  onConfirm: () => void;
}) {
  return (
    <Dialog2 open={open} onClose={onClose} size="content">
      {open ? (
        <DialogContent
          senderAddress={senderAddress}
          receiverAddress={receiverAddress}
          network={network}
          addressAction={addressAction}
          warning={warning}
          onCancel={onClose}
          onConfirm={onConfirm}
        />
      ) : null}
    </Dialog2>
  );
}

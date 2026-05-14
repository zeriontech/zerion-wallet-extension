import React from 'react';
import { Dialog2 } from 'src/ui/ui-kit/ModalDialogs/Dialog2';
import { VStack } from 'src/ui/ui-kit/VStack';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { Button } from 'src/ui/ui-kit/Button';
import { truncateAddress } from 'src/ui/shared/truncateAddress';
import { useProfileName } from 'src/ui/shared/useProfileName';

function DialogContent({
  address,
  name,
  onConfirm,
  onClose,
}: {
  address: string;
  name?: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const profile = useProfileName({ address, name: null });
  const displayName = name || profile.value || truncateAddress(address, 5);
  return (
    <VStack gap={20}>
      <UIText kind="body/regular" color="var(--neutral-700)">
        Remove{' '}
        <UIText kind="body/accent" inline={true}>
          {displayName}
        </UIText>{' '}
        from your address book?
      </UIText>
      <HStack gap={8} style={{ gridTemplateColumns: '1fr 1fr' }}>
        <Button
          type="button"
          kind="neutral"
          onClick={onClose}
          style={{ width: '100%' }}
        >
          Cancel
        </Button>
        <Button
          type="button"
          kind="danger"
          onClick={onConfirm}
          style={{ width: '100%' }}
        >
          Remove
        </Button>
      </HStack>
    </VStack>
  );
}

export function RemoveAddressBookEntryDialog({
  open,
  onClose,
  address,
  name,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  address: string;
  name?: string;
  onConfirm: () => void;
}) {
  return (
    <Dialog2
      open={open}
      onClose={onClose}
      title="Remove Address"
      size="content"
    >
      {open ? (
        <DialogContent
          address={address}
          name={name}
          onConfirm={onConfirm}
          onClose={onClose}
        />
      ) : null}
    </Dialog2>
  );
}

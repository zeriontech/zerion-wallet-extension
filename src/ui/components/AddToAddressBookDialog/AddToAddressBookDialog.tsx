import React, { useEffect, useRef, useState } from 'react';
import type { AddressBookEntry } from 'src/background/Wallet/model/types';
import { Dialog2 } from 'src/ui/ui-kit/ModalDialogs/Dialog2';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { Button } from 'src/ui/ui-kit/Button';
import { WalletAvatar } from 'src/ui/components/WalletAvatar';
import { useProfileName } from 'src/ui/shared/useProfileName';
import { truncateAddress } from 'src/ui/shared/truncateAddress';
import CloseIcon from 'jsx:src/ui/assets/close.svg';
import * as styles from './styles.module.css';

function DialogContent({
  address,
  initialName,
  onSubmit,
}: {
  address: string;
  initialName?: string;
  onSubmit: (entry: AddressBookEntry) => void;
}) {
  const [name, setName] = useState(initialName ?? '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.focus();
    const length = input.value.length;
    input.setSelectionRange(length, length);
  }, []);

  const profile = useProfileName({ address, name: null });
  const placeholder = profile.value || truncateAddress(address, 5);
  const displayValue = name.length > 0 ? name : placeholder;

  return (
    <form
      style={{ padding: '24px 24px 40px' }}
      onSubmit={(event) => {
        event.preventDefault();
        const trimmed = name.trim();
        onSubmit({ address, name: trimmed || undefined });
      }}
    >
      <VStack gap={24}>
        <VStack gap={16} style={{ justifyItems: 'center' }}>
          <WalletAvatar
            address={address}
            size={48}
            active={false}
            borderRadius={12}
          />
          <VStack gap={8} style={{ justifyItems: 'center', width: '100%' }}>
            <UIText kind="headline/h2" className={styles.nameInputWrapper}>
              <span className={styles.nameField} data-value={displayValue}>
                <input
                  ref={inputRef}
                  className={styles.nameInput}
                  type="text"
                  value={name}
                  placeholder={placeholder}
                  onChange={(event) => setName(event.currentTarget.value)}
                  maxLength={64}
                  autoComplete="off"
                  spellCheck={false}
                />
              </span>
              {name.length > 0 ? (
                <button
                  type="button"
                  className={styles.clearButton}
                  onClick={() => {
                    setName('');
                    inputRef.current?.focus();
                  }}
                  title="Clear"
                  aria-label="Clear"
                >
                  <CloseIcon style={{ width: 12, height: 12 }} />
                </button>
              ) : null}
            </UIText>
            <UIText kind="caption/regular" color="var(--neutral-500)">
              {truncateAddress(address, 5)}
            </UIText>
          </VStack>
        </VStack>
        <Button type="submit" kind="primary" style={{ width: '100%' }}>
          Save
        </Button>
      </VStack>
    </form>
  );
}

export function AddToAddressBookDialog({
  open,
  onClose,
  address,
  initialName,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  address: string;
  initialName?: string;
  onSubmit: (entry: AddressBookEntry) => void;
}) {
  const title = initialName == null ? 'Add to Address Book' : 'Edit';
  return (
    <Dialog2 open={open} onClose={onClose} title={title} size="content">
      {open ? (
        <DialogContent
          address={address}
          initialName={initialName}
          onSubmit={onSubmit}
        />
      ) : null}
    </Dialog2>
  );
}

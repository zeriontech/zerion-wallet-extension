import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { AddressBookEntry } from 'src/background/Wallet/model/types';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageBottom } from 'src/ui/components/PageBottom';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { useBackgroundKind } from 'src/ui/components/Background';
import { whiteBackgroundKind } from 'src/ui/components/Background/Background';
import { Button } from 'src/ui/ui-kit/Button';
import { HStack } from 'src/ui/ui-kit/HStack';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import AddIcon from 'jsx:src/ui/assets/plus.svg';
import EditIcon from 'jsx:src/ui/assets/edit.svg';
import SendIcon from 'jsx:src/ui/assets/actions/send.svg';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import { usePreferences } from 'src/ui/features/preferences';
import { useAddressBook } from 'src/ui/features/address-book';
import { AddToAddressBookDialog } from 'src/ui/components/AddToAddressBookDialog';
import { ReceiverAddressDialog } from 'src/ui/components/ReceiverAddressDialog';
import { useDialog2 } from 'src/ui/ui-kit/ModalDialogs/Dialog2';
import { AddressBookRow } from './AddressBookRow';
import { AddressBookListEdit } from './AddressBookListEdit';
import { RecentAddressesSection } from './RecentAddressesSection';
import { RemoveAddressBookEntryDialog } from './RemoveAddressBookEntryDialog';

function EmptyState({ onAddClick }: { onAddClick: () => void }) {
  return (
    <VStack
      gap={16}
      style={{ textAlign: 'center', paddingInline: 24, paddingBlock: 32 }}
    >
      <VStack gap={8}>
        <UIText kind="headline/h2">Address Book is Empty</UIText>
        <UIText kind="body/regular" color="var(--neutral-500)">
          Make your transfers quick and secure by saving frequently used
          addresses.
        </UIText>
      </VStack>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Button
          kind="primary"
          style={{ paddingInline: 24 }}
          onClick={onAddClick}
        >
          Add First Address
        </Button>
      </div>
    </VStack>
  );
}

export function AddressBook() {
  useBackgroundKind(whiteBackgroundKind);
  const { entries, upsert, remove, reorder, has } = useAddressBook();
  const { preferences } = usePreferences();
  const pickerDialog = useDialog2();

  const pickerPredicate = useCallback(
    (address: string) => !has(address),
    [has]
  );
  const pickerValidateMatch = useCallback(
    (address: string) => (has(address) ? 'Already in your Address Book' : ''),
    [has]
  );

  const [searchParams, setSearchParams] = useSearchParams();
  const editMode = searchParams.get('edit') === 'true';
  const setEditMode = useCallback(
    (value: boolean) => {
      if (value) {
        searchParams.set('edit', 'true');
      } else {
        searchParams.delete('edit');
      }
      setSearchParams(searchParams, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  // Auto-exit edit mode when the list becomes empty
  useEffect(() => {
    if (editMode && entries.length === 0) {
      setEditMode(false);
    }
  }, [editMode, entries.length, setEditMode]);

  const [editingEntry, setEditingEntry] = useState<AddressBookEntry | null>(
    null
  );
  const [editingAddress, setEditingAddress] = useState<string | null>(null);
  const [removingEntry, setRemovingEntry] = useState<AddressBookEntry | null>(
    null
  );

  const recentAddresses = preferences?.recentAddresses ?? [];
  const filteredRecents = useMemo(() => {
    const savedSet = new Set(
      entries.map((entry) => normalizeAddress(entry.address))
    );
    return recentAddresses.filter(
      (address) => !savedSet.has(normalizeAddress(address))
    );
  }, [recentAddresses, entries]);

  const isEmpty = entries.length === 0;

  const title = (
    <NavigationTitle
      title="Address Book"
      elementEnd={
        isEmpty ? null : (
          <HStack
            gap={editMode ? 8 : 0}
            alignItems="center"
            style={{ position: 'relative', left: editMode ? -16 : -36 }}
          >
            {editMode ? (
              <Button
                kind="ghost"
                size={36}
                style={{ padding: 6 }}
                onClick={() => setEditMode(false)}
              >
                Done
              </Button>
            ) : (
              <>
                <Button
                  kind="ghost"
                  size={36}
                  style={{ padding: 6 }}
                  title="Edit"
                  onClick={() => setEditMode(true)}
                >
                  <EditIcon style={{ width: 24, height: 24 }} />
                </Button>
                <Button
                  kind="ghost"
                  size={36}
                  style={{ padding: 6 }}
                  title="Add Address"
                  onClick={pickerDialog.openDialog}
                >
                  <AddIcon style={{ width: 24, height: 24 }} />
                </Button>
              </>
            )}
          </HStack>
        )
      }
    />
  );

  const handlePickerSelect = (address: string) => {
    pickerDialog.closeDialog();
    setEditingAddress(address);
  };

  const dialogs = (
    <>
      <ReceiverAddressDialog
        open={pickerDialog.open}
        onClose={pickerDialog.closeDialog}
        title="Add to Address Book"
        predicate={pickerPredicate}
        validateMatch={pickerValidateMatch}
        showAddressBookSection={false}
        onSelect={handlePickerSelect}
      />
      <AddToAddressBookDialog
        open={editingEntry != null}
        onClose={() => setEditingEntry(null)}
        address={editingEntry?.address ?? ''}
        initialName={editingEntry?.name ?? ''}
        onSubmit={(entry) => {
          upsert(entry);
          setEditingEntry(null);
        }}
      />
      <AddToAddressBookDialog
        open={editingAddress != null}
        onClose={() => setEditingAddress(null)}
        address={editingAddress ?? ''}
        onSubmit={(entry) => {
          upsert(entry);
          setEditingAddress(null);
        }}
      />
      <RemoveAddressBookEntryDialog
        open={removingEntry != null}
        onClose={() => setRemovingEntry(null)}
        address={removingEntry?.address ?? ''}
        name={removingEntry?.name}
        onConfirm={() => {
          if (removingEntry) {
            remove(removingEntry.address);
          }
          setRemovingEntry(null);
        }}
      />
    </>
  );

  if (isEmpty) {
    return (
      <PageColumn>
        {title}
        <EmptyState onAddClick={pickerDialog.openDialog} />
        {filteredRecents.length > 0 ? (
          <VStack
            gap={2}
            style={{
              ['--surface-background-color' as string]: 'transparent',
            }}
          >
            <RecentAddressesSection
              addresses={filteredRecents}
              onAdd={(address) => setEditingAddress(address)}
            />
          </VStack>
        ) : null}
        <PageBottom />
        {dialogs}
      </PageColumn>
    );
  }

  return (
    <PageColumn>
      {title}
      <Spacer height={10} />
      <VStack
        gap={2}
        style={{
          ['--surface-background-color' as string]: 'transparent',
        }}
      >
        {editMode ? (
          <AddressBookListEdit
            entries={entries}
            onReorder={reorder}
            onEditEntry={(entry) => setEditingEntry(entry)}
            onRemoveEntry={(entry) => setRemovingEntry(entry)}
          />
        ) : (
          <VStack gap={0}>
            {entries.map((entry) => (
              <AddressBookRow
                key={normalizeAddress(entry.address)}
                entry={entry}
                rightSlot={
                  <Button
                    as={UnstyledLink}
                    kind="ghost"
                    size={36}
                    style={{ padding: 6 }}
                    title="Send"
                    aria-label="Send"
                    to={`/send-form?to=${encodeURIComponent(entry.address)}`}
                  >
                    <SendIcon style={{ width: 20, height: 20 }} />
                  </Button>
                }
              />
            ))}
          </VStack>
        )}
        {!editMode ? (
          <RecentAddressesSection
            addresses={filteredRecents}
            onAdd={(address) => setEditingAddress(address)}
          />
        ) : null}
      </VStack>
      <PageBottom />
      {dialogs}
    </PageColumn>
  );
}

import React, { useCallback, useMemo, useState } from 'react';
import cn from 'classnames';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import { isEthereumAddress } from 'src/shared/isEthereumAddress';
import { isMatchForEcosystem } from 'src/shared/wallet/shared';
import type { BlockchainType } from 'src/shared/wallet/classifiers';
import { truncateAddress } from 'src/ui/shared/truncateAddress';
import { BlockieImg } from 'src/ui/components/BlockieImg';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { Button } from 'src/ui/ui-kit/Button';
import { useDialog2 } from 'src/ui/ui-kit/ModalDialogs/Dialog2';
import {
  ReceiverAddressDialog,
  useReceiverDisplayName,
} from 'src/ui/components/ReceiverAddressDialog';
import { AddToAddressBookDialog } from 'src/ui/components/AddToAddressBookDialog';
import { useAddressBook } from 'src/ui/features/address-book';
import PersonAddIcon from 'jsx:src/ui/assets/person-add.svg';
import PersonSuccessIcon from 'jsx:src/ui/assets/person-success.svg';
import type { HandleChangeFunction, SendFormState2 } from '../types';
import * as styles from './ReceiverAddressSelector.module.css';

const AVATAR_SIZE = 24;
const AVATAR_RADIUS = 8;

function getEcosystemLabel(ecosystem: BlockchainType): string {
  switch (ecosystem) {
    case 'solana':
      return 'Solana';
    case 'evm':
      return 'Ethereum';
  }
}

export function ReceiverAddressSelector({
  formState,
  onChange,
  senderAddress,
}: {
  formState: SendFormState2;
  onChange: HandleChangeFunction;
  senderAddress: string;
}) {
  const dialog = useDialog2();
  const [addingToBookAddress, setAddingToBookAddress] = useState<string | null>(
    null
  );

  const senderEcosystem: BlockchainType = isEthereumAddress(senderAddress)
    ? 'evm'
    : 'solana';

  const handleSelect = useCallback(
    (address: string) => {
      onChange('to', address);
    },
    [onChange]
  );

  const predicate = useCallback(
    (address: string) => isMatchForEcosystem(address, senderEcosystem),
    [senderEcosystem]
  );

  const validateMatch = useCallback(
    (address: string): string => {
      if (isMatchForEcosystem(address, senderEcosystem)) return '';
      const recipientLabel = getEcosystemLabel(
        senderEcosystem === 'evm' ? 'solana' : 'evm'
      );
      const walletLabel = getEcosystemLabel(senderEcosystem);
      return `Recipient is on ${recipientLabel}, but sending wallet is on ${walletLabel}.`;
    },
    [senderEcosystem]
  );

  const normalizedTo = formState.to ? normalizeAddress(formState.to) : null;
  const { upsert: upsertAddressBookEntry } = useAddressBook();
  const display = useReceiverDisplayName(normalizedTo);

  const resolvedName = useMemo(() => {
    if (!normalizedTo) return null;
    return (
      display.addressBookName ||
      display.walletName ||
      display.handle ||
      truncateAddress(normalizedTo, 4)
    );
  }, [normalizedTo, display]);

  const addressHead = normalizedTo ? normalizedTo.slice(0, -6) : '';
  const addressTail = normalizedTo ? normalizedTo.slice(-6) : '';

  const handleOpenAddToBook = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      if (normalizedTo) {
        setAddingToBookAddress(normalizedTo);
      }
    },
    [normalizedTo]
  );

  const renderRightAction = () => {
    if (!normalizedTo) return null;
    if (display.isInAddressBook) {
      return (
        <span className={styles.rightAction} title="Saved to Address Book">
          <PersonSuccessIcon
            style={{ width: 24, height: 24, color: 'var(--positive-500)' }}
          />
        </span>
      );
    }
    return (
      <Button
        type="button"
        kind="ghost"
        size={36}
        className={styles.rightActionButton}
        title="Add to Address Book"
        onClick={handleOpenAddToBook}
        style={{ width: 36, padding: 6 }}
      >
        <PersonAddIcon style={{ width: 24, height: 24 }} />
      </Button>
    );
  };

  return (
    <>
      <div className={cn(styles.container)}>
        <UnstyledButton
          type="button"
          className={styles.containerOverlay}
          onClick={dialog.openDialog}
          aria-label="Select recipient"
        />
        <div className={styles.contentLayer}>
          {normalizedTo ? (
            <>
              <div className={styles.row}>
                <UIText
                  kind="body/regular"
                  className={styles.label}
                  color="var(--neutral-700)"
                >
                  To:
                </UIText>
                <div
                  style={{
                    width: AVATAR_SIZE,
                    height: AVATAR_SIZE,
                    borderRadius: AVATAR_RADIUS,
                    overflow: 'hidden',
                    flexShrink: 0,
                  }}
                >
                  {display.avatarUrl ? (
                    <img
                      src={display.avatarUrl}
                      alt=""
                      width={AVATAR_SIZE}
                      height={AVATAR_SIZE}
                      style={{
                        width: AVATAR_SIZE,
                        height: AVATAR_SIZE,
                        borderRadius: AVATAR_RADIUS,
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                  ) : (
                    <BlockieImg
                      address={normalizedTo}
                      size={AVATAR_SIZE}
                      borderRadius={AVATAR_RADIUS}
                    />
                  )}
                </div>
                <UIText kind="body/accent" className={styles.name}>
                  {resolvedName}
                </UIText>
                {renderRightAction()}
              </div>
              <div style={{ height: 4 }} />
              <div className={styles.addressRow} title={normalizedTo}>
                <UIText
                  kind="caption/regular"
                  color="var(--neutral-500)"
                  className={styles.addressHead}
                >
                  {addressHead}
                </UIText>
                <UIText
                  kind="caption/regular"
                  color="var(--neutral-500)"
                  className={styles.addressTail}
                >
                  {addressTail}
                </UIText>
              </div>
            </>
          ) : (
            <>
              <div className={styles.row}>
                <UIText
                  kind="body/regular"
                  className={styles.label}
                  color="var(--neutral-700)"
                >
                  To:
                </UIText>
                <div className={styles.skeletonAvatar} />
                <div className={styles.skeletonLineLg} />
              </div>
              <div style={{ height: 8 }} />
              <div className={styles.skeletonLineSm} />
            </>
          )}
        </div>
      </div>
      <ReceiverAddressDialog
        open={dialog.open}
        onClose={dialog.closeDialog}
        title="Recipient"
        predicate={predicate}
        validateMatch={validateMatch}
        onSelect={handleSelect}
      />
      <AddToAddressBookDialog
        open={addingToBookAddress != null}
        onClose={() => setAddingToBookAddress(null)}
        address={addingToBookAddress ?? ''}
        onSubmit={(entry) => {
          upsertAddressBookEntry(entry);
          setAddingToBookAddress(null);
        }}
      />
    </>
  );
}

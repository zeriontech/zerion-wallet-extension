import React, { useState } from 'react';
import type { ExternallyOwnedAccount } from 'src/shared/types/ExternallyOwnedAccount';
import { Button } from 'src/ui/ui-kit/Button';
import { Dialog2 } from 'src/ui/ui-kit/ModalDialogs/Dialog2';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Toggle } from 'src/ui/ui-kit/Toggle';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { WalletAvatar } from 'src/ui/components/WalletAvatar';
import { WalletDisplayName } from 'src/ui/components/WalletDisplayName';
import { focusNode } from 'src/ui/shared/focusNode';
import { normalizeAddress } from 'src/shared/normalizeAddress';

export function ReadonlyReceiverDialog({
  open,
  onClose,
  wallet,
  onProceed,
}: {
  open: boolean;
  onClose: () => void;
  wallet: ExternallyOwnedAccount | null;
  onProceed: (params: { dontShowAgain: boolean }) => void;
}) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  return (
    <Dialog2
      open={open}
      onClose={() => {
        setDontShowAgain(false);
        onClose();
      }}
      size="content"
    >
      <VStack gap={24} style={{ padding: 24, justifyItems: 'center' }}>
        <VStack
          gap={16}
          style={{ justifyItems: 'center', textAlign: 'center' }}
        >
          <UIText kind="headline/h3">
            The wallet you’ve selected is read-only
          </UIText>
          <UIText kind="body/regular">
            You’ll need to import the private keys or recovery phrase to access
            the funds
          </UIText>
        </VStack>
        {wallet ? (
          <VStack
            gap={8}
            style={{
              width: '100%',
              padding: '12px 8px',
              borderRadius: 12,
              backgroundColor: 'var(--neutral-100)',
              justifyItems: 'center',
            }}
          >
            <HStack gap={8} alignItems="center">
              <WalletAvatar
                address={wallet.address}
                size={28}
                borderRadius={6}
              />
              <UIText kind="body/accent">
                <WalletDisplayName wallet={wallet} />
              </UIText>
            </HStack>
            <UIText kind="caption/regular" color="var(--neutral-500)">
              {normalizeAddress(wallet.address)}
            </UIText>
          </VStack>
        ) : null}
        <label style={{ width: '100%' }}>
          <HStack gap={8} justifyContent="center" alignItems="center">
            <UIText kind="small/regular" color="var(--neutral-500)">
              Don’t show for this wallet
            </UIText>
            <Toggle
              checked={dontShowAgain}
              onChange={(event) => setDontShowAgain(event.target.checked)}
            />
          </HStack>
        </label>
        <HStack
          gap={8}
          style={{
            width: '100%',
            gridAutoColumns: '1fr',
            gridAutoFlow: 'column',
          }}
        >
          <Button
            kind="regular"
            onClick={() => {
              setDontShowAgain(false);
              onClose();
            }}
            ref={focusNode}
          >
            Back
          </Button>
          <Button
            kind="primary"
            onClick={() => {
              onProceed({ dontShowAgain });
              setDontShowAgain(false);
            }}
          >
            Proceed Anyway
          </Button>
        </HStack>
      </VStack>
    </Dialog2>
  );
}

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { BottomSheetDialog } from 'src/ui/ui-kit/ModalDialogs/BottomSheetDialog';
import { Button } from 'src/ui/ui-kit/Button';
import { Input } from 'src/ui/ui-kit/Input';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { HStack } from 'src/ui/ui-kit/HStack';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import { TextAnchor } from 'src/ui/ui-kit/TextAnchor';
import { accountPublicRPCPort, walletPort } from 'src/ui/shared/channels';
import { emitter } from 'src/ui/shared/events';
import { getError } from 'src/shared/errors/getError';
import { zeroizeAfterSubmission } from 'src/ui/shared/zeroize-submission';
import { usePreferences } from 'src/ui/features/preferences';
import { urlContext } from 'src/shared/UrlContext';
import { openUrl } from 'src/ui/shared/openUrl';
import { getPopupUrl } from 'src/shared/getPopupUrl';
import { isMnemonicRestorationError } from './isMnemonicRestorationError';

type View = 'intro' | 'recover' | 'success' | 'no-password';

function IntroView({
  onRemember,
  onDontRemember,
  onCancel,
}: {
  onRemember: () => void;
  onDontRemember: () => void;
  onCancel: () => void;
}) {
  return (
    <VStack gap={24}>
      <UIText kind="body/accent">Recovery Phrase Needs Re-encryption</UIText>
      <UIText kind="small/regular" color="var(--neutral-800)">
        An issue in a previous app version left some users' recovery phrases
        encrypted with their original password instead of their current one.
        Your funds are safe and your wallets work normally — but to view or
        restore your recovery phrase, you'll need your original password. Need
        help? Contact support at{' '}
        <TextAnchor
          href="https://help.zerion.io"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--primary)' }}
        >
          help.zerion.io
        </TextAnchor>
        .
      </UIText>
      <VStack gap={8}>
        <Button kind="primary" onClick={onRemember} style={{ width: '100%' }}>
          I remember my original password
        </Button>
        <Button
          kind="regular"
          onClick={onDontRemember}
          style={{ width: '100%' }}
        >
          I don't remember it
        </Button>
        <Button kind="ghost" onClick={onCancel} style={{ width: '100%' }}>
          Not now
        </Button>
      </VStack>
    </VStack>
  );
}

function RecoverView({
  isLoading,
  error,
  onSubmit,
  onCancel,
}: {
  isLoading: boolean;
  error: unknown;
  onSubmit: (initialPassword: string, currentPassword: string) => void;
  onCancel: () => void;
}) {
  const errorMessage = error
    ? isMnemonicRestorationError(error)
      ? 'Those passwords didn’t work. Please double-check both and try again.'
      : getError(error).message || 'unknown error'
    : null;

  return (
    <VStack gap={24}>
      <UIText kind="body/accent">Restore Recovery Phrase</UIText>
      <UIText kind="small/regular" color="var(--neutral-800)">
        Enter the password you used when you first set up the wallet, and your
        current password. We'll re-encrypt your recovery phrase so it matches.{' '}
        Need help? Contact support at{' '}
        <TextAnchor
          href="https://help.zerion.io"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--primary)' }}
        >
          help.zerion.io
        </TextAnchor>
        .
      </UIText>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          const initialPassword = formData.get('initialPassword') as
            | string
            | undefined;
          const currentPassword = formData.get('currentPassword') as
            | string
            | undefined;
          if (!initialPassword || !currentPassword) {
            return;
          }
          onSubmit(initialPassword, currentPassword);
        }}
      >
        <VStack gap={16}>
          <VStack gap={12}>
            <Input
              autoFocus={true}
              type="password"
              name="initialPassword"
              placeholder="Initial password"
              required={true}
            />
            <Input
              type="password"
              name="currentPassword"
              placeholder="Current password"
              required={true}
            />
          </VStack>
          {errorMessage ? (
            <UIText kind="caption/regular" color="var(--negative-500)">
              {errorMessage}
            </UIText>
          ) : null}
          <VStack gap={8}>
            <Button
              kind="primary"
              disabled={isLoading}
              style={{ width: '100%' }}
            >
              {isLoading ? (
                <HStack gap={0} style={{ justifyContent: 'center' }}>
                  <CircleSpinner />
                </HStack>
              ) : (
                'Fix the data'
              )}
            </Button>
            <Button
              kind="ghost"
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              style={{ width: '100%' }}
            >
              Cancel
            </Button>
          </VStack>
        </VStack>
      </form>
    </VStack>
  );
}

function SuccessView({ onDone }: { onDone: () => void }) {
  return (
    <VStack gap={24}>
      <UIText kind="body/accent">Recovery Phrase Restored</UIText>
      <UIText kind="small/regular" color="var(--neutral-800)">
        Your recovery phrase is now encrypted with your current password. You
        can view or back it up normally.
      </UIText>
      <Button kind="primary" onClick={onDone} style={{ width: '100%' }}>
        Done
      </Button>
    </VStack>
  );
}

function NoPasswordView({
  onBack,
  onGoToManageWallets,
}: {
  onBack: () => void;
  onGoToManageWallets: () => void;
}) {
  return (
    <VStack gap={24}>
      <UIText kind="body/accent">Manage Your Wallets</UIText>
      <UIText kind="small/regular" color="var(--neutral-800)">
        Without your original password, your recovery phrase can't be
        re-encrypted. Your wallets and funds remain safe and fully usable.
      </UIText>
      <UIText kind="small/regular" color="var(--neutral-800)">
        The cleanest fix is to reimport your wallets when you have your recovery
        phrase available. If you need to access them right away, you can export
        each wallet's private key individually from Manage Wallets. Need help?
        Contact support at{' '}
        <TextAnchor
          href="https://help.zerion.io"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--primary)' }}
        >
          help.zerion.io
        </TextAnchor>
        .
      </UIText>
      <VStack gap={8}>
        <Button
          kind="primary"
          onClick={onGoToManageWallets}
          style={{ width: '100%' }}
        >
          Go to Manage Wallets
        </Button>
        <Button kind="ghost" onClick={onBack} style={{ width: '100%' }}>
          Back
        </Button>
      </VStack>
    </VStack>
  );
}

export function MnemonicPhraseRestoration() {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const navigate = useNavigate();
  const [view, setView] = useState<View>('intro');
  const { setPreferences } = usePreferences();

  const userQuery = useQuery({
    queryKey: ['account/getExistingUser'],
    queryFn: () => accountPublicRPCPort.request('getExistingUser'),
  });

  const restoreMutation = useMutation({
    mutationFn: async ({
      initialPassword,
      currentPassword,
    }: {
      initialPassword: string;
      currentPassword: string;
    }) => {
      if (initialPassword === currentPassword) {
        throw new Error(
          'Initial and current passwords must be different. If they were the same, no re-encryption is needed.'
        );
      }
      if (!userQuery.data) {
        throw new Error('User not found');
      }
      await accountPublicRPCPort.request('restoreMnemonicWithInitialPassword', {
        user: userQuery.data,
        initialPassword,
        currentPassword,
      });
    },
    onSuccess: () => {
      walletPort.request('mnemonicRestorationSuccess');
      setPreferences({ restoreRecoveryPhraseSuccess: true });
      setView('success');
    },
    onError: () => {
      walletPort.request('mnemonicRestorationError');
    },
    onSettled: () => {
      zeroizeAfterSubmission();
    },
  });

  // Open the dialog on trigger (idempotent: ignore re-emits while already open).
  useEffect(() => {
    const unbind = emitter.on('mnemonicRestorationNeeded', () => {
      const dialog = dialogRef.current;
      if (!dialog || dialog.open) {
        return;
      }
      dialog.showModal();
      walletPort.request('mnemonicRestorationShown');
    });
    return unbind;
  }, []);

  // Suppress Escape: capture before BaseDialog's document-level handler.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
      }
    };
    dialog.addEventListener('keydown', handler, true);
    return () => dialog.removeEventListener('keydown', handler, true);
  }, []);

  const handleClosed = useCallback(() => {
    setView('intro');
    restoreMutation.reset();
    zeroizeAfterSubmission();
  }, [restoreMutation]);

  const handleClose = useCallback(() => {
    dialogRef.current?.close();
    if (urlContext.windowLayout === 'column') {
      navigate('/');
    }
  }, [navigate]);

  const handleDone = useCallback(() => {
    dialogRef.current?.close();
    window.location.reload();
  }, []);

  const handleGoToManageWallets = useCallback(() => {
    setPreferences({ restoreRecoveryPhraseSuccess: true });
    dialogRef.current?.close();
    if (urlContext.windowLayout === 'page') {
      openUrl(new URL('#/wallets', getPopupUrl()), {
        windowType: 'tab',
        windowLayout: 'column',
      });
    } else {
      navigate('/wallets');
    }
  }, [navigate, setPreferences]);

  return (
    <BottomSheetDialog
      ref={dialogRef}
      height="fit-content"
      closeOnClickOutside={false}
      onClosed={handleClosed}
      renderWhenOpen={() => {
        if (view === 'intro') {
          return (
            <IntroView
              onRemember={() => setView('recover')}
              onDontRemember={() => setView('no-password')}
              onCancel={handleClose}
            />
          );
        }
        if (view === 'recover') {
          return (
            <RecoverView
              isLoading={restoreMutation.isLoading}
              error={restoreMutation.error}
              onSubmit={(initialPassword, currentPassword) =>
                restoreMutation.mutate({ initialPassword, currentPassword })
              }
              onCancel={handleClose}
            />
          );
        }
        if (view === 'success') {
          return <SuccessView onDone={handleDone} />;
        }
        return (
          <NoPasswordView
            onBack={() => setView('intro')}
            onGoToManageWallets={handleGoToManageWallets}
          />
        );
      }}
    />
  );
}

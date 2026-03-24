import React, {
  useCallback,
  useId,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { PublicUser } from 'src/shared/types/User';
import { accountPublicRPCPort } from 'src/ui/shared/channels';
import { zeroizeAfterSubmission } from 'src/ui/shared/zeroize-submission';
import { Button } from 'src/ui/ui-kit/Button';
import { Input } from 'src/ui/ui-kit/Input';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import { BottomSheetDialog } from 'src/ui/ui-kit/ModalDialogs/BottomSheetDialog';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import TouchIdIcon from 'jsx:src/ui/assets/touch-id.svg';
import {
  getPasswordWithPasskey,
  getPasskeyTitle,
} from 'src/ui/pages/Security/passkey';
import { DialogCloseButton } from 'src/ui/ui-kit/ModalDialogs/DialogTitle/DialogCloseButton';

export interface SigningPasswordGateHandle {
  confirm(): Promise<void>;
}

function PasskeyView({
  passkeyTitle,
  isLoading,
  error,
  onRetry,
  onUsePassword,
}: {
  passkeyTitle: string;
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
  onUsePassword: () => void;
}) {
  return (
    <VStack gap={16} style={{ justifyItems: 'center' }}>
      <UnstyledButton
        type="button"
        aria-label={`Sign with ${passkeyTitle}`}
        onClick={onRetry}
        disabled={isLoading}
        style={{
          width: 56,
          height: 56,
          padding: 7,
          borderRadius: '50%',
          border: '1px solid var(--neutral-300)',
          color: 'var(--neutral-500)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {isLoading ? (
          <CircleSpinner
            size="40px"
            color="var(--primary)"
            trackColor="var(--primary-200)"
          />
        ) : (
          <TouchIdIcon />
        )}
      </UnstyledButton>
      {error ? (
        <UIText kind="small/regular" color="var(--negative-500)">
          {error.message || 'unknown error'}
        </UIText>
      ) : null}
      <Button kind="regular" type="button" onClick={onUsePassword}>
        Use Password Instead
      </Button>
    </VStack>
  );
}

function PasswordView({
  inputId,
  user,
  isLoading,
  error,
  onSubmit,
}: {
  inputId: string;
  user: PublicUser | null | undefined;
  isLoading: boolean;
  error: Error | null;
  onSubmit: (password: string) => void;
}) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const password = new FormData(event.currentTarget).get('password') as
          | string
          | undefined;
        if (!password || !user) {
          return;
        }
        onSubmit(password);
      }}
    >
      <VStack gap={16}>
        <VStack gap={4}>
          <Input
            id={inputId}
            autoFocus={true}
            type="password"
            name="password"
            placeholder="Enter password"
            required={true}
          />
          {error ? (
            <UIText kind="caption/regular" color="var(--negative-500)">
              {error.message || 'unknown error'}
            </UIText>
          ) : null}
        </VStack>
        <Button disabled={isLoading}>
          {isLoading ? 'Checking...' : 'Confirm'}
        </Button>
      </VStack>
    </form>
  );
}

export const SigningPasswordGate = React.forwardRef(
  function SigningPasswordGate(
    { requirePasswordToSign }: { requirePasswordToSign: boolean },
    ref: React.Ref<SigningPasswordGateHandle>
  ) {
    const dialogRef = useRef<HTMLDialogElementInterface | null>(null);
    const resolveRef = useRef<(() => void) | null>(null);
    const rejectRef = useRef<((reason?: unknown) => void) | null>(null);
    const [showPasswordInput, setShowPasswordInput] = useState(false);

    const userQuery = useQuery({
      queryKey: ['account/getExistingUser'],
      queryFn: () => accountPublicRPCPort.request('getExistingUser'),
      useErrorBoundary: true,
    });

    const passkeyEnabledQuery = useQuery({
      queryKey: ['account/getPasskeyEnabled'],
      queryFn: () => accountPublicRPCPort.request('getPasskeyEnabled'),
      useErrorBoundary: true,
    });

    const passkeyEnabled = passkeyEnabledQuery.data ?? false;
    const passkeyTitle = getPasskeyTitle();

    const handleSuccess = useCallback(() => {
      zeroizeAfterSubmission();
      resolveRef.current?.();
      resolveRef.current = null;
      rejectRef.current = null;
      dialogRef.current?.close();
    }, []);

    const loginMutation = useMutation({
      mutationFn: async ({
        user,
        password,
      }: {
        user: PublicUser;
        password: string;
      }) => {
        return accountPublicRPCPort.request('login', { user, password });
      },
      onSuccess: handleSuccess,
    });

    const passkeyLoginMutation = useMutation({
      mutationFn: async () => {
        const user = userQuery.data;
        if (!user) {
          throw new Error('User not found');
        }
        const password = await getPasswordWithPasskey();
        return accountPublicRPCPort.request('login', { user, password });
      },
      onSuccess: handleSuccess,
    });

    const triggerPasskey = useCallback(() => {
      passkeyLoginMutation.mutate();
    }, [passkeyLoginMutation]);

    useImperativeHandle(ref, () => ({
      confirm(): Promise<void> {
        if (!requirePasswordToSign) {
          return Promise.resolve();
        }
        return new Promise<void>((resolve, reject) => {
          resolveRef.current = resolve;
          rejectRef.current = reject;
          setShowPasswordInput(!passkeyEnabled);
          loginMutation.reset();
          passkeyLoginMutation.reset();
          dialogRef.current?.showModal();
          if (passkeyEnabled) {
            // Auto-trigger passkey on dialog open
            setTimeout(() => passkeyLoginMutation.mutate(), 100);
          }
        });
      },
    }));

    const handleDialogClose = useCallback(() => {
      // If dialog closes without success, reject the promise
      if (resolveRef.current) {
        rejectRef.current?.(new Error('User cancelled'));
        resolveRef.current = null;
        rejectRef.current = null;
      }
    }, []);

    const inputId = useId();

    return (
      <BottomSheetDialog
        ref={dialogRef}
        height="fit-content"
        onClosed={handleDialogClose}
        renderWhenOpen={() => (
          <>
            <DialogCloseButton
              style={{ position: 'absolute', top: 8, right: 8 }}
            />
            <VStack gap={24}>
              <UIText kind="headline/h2" style={{ textAlign: 'center' }}>
                Confirm to Sign
              </UIText>
              {passkeyEnabled && !showPasswordInput ? (
                <PasskeyView
                  passkeyTitle={passkeyTitle}
                  isLoading={passkeyLoginMutation.isLoading}
                  error={passkeyLoginMutation.error as Error | null}
                  onRetry={triggerPasskey}
                  onUsePassword={() => setShowPasswordInput(true)}
                />
              ) : (
                <PasswordView
                  inputId={inputId}
                  user={userQuery.data}
                  isLoading={loginMutation.isLoading}
                  error={loginMutation.error as Error | null}
                  onSubmit={(password) => {
                    if (!userQuery.data) {
                      return;
                    }
                    loginMutation.mutate({
                      user: userQuery.data,
                      password,
                    });
                  }}
                />
              )}
            </VStack>
          </>
        )}
      />
    );
  }
);

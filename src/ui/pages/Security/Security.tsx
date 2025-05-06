import React, { useCallback, useRef, useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ViewSuspense } from 'src/ui/components/ViewSuspense';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { HStack } from 'src/ui/ui-kit/HStack';
import { AngleRightRow } from 'src/ui/components/AngleRightRow';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import { UIText } from 'src/ui/ui-kit/UIText';
import { useGlobalPreferences } from 'src/ui/features/preferences/usePreferences';
import { Frame } from 'src/ui/ui-kit/Frame';
import { FrameListItemLink } from 'src/ui/ui-kit/FrameList';
import { useBackgroundKind } from 'src/ui/components/Background';
import { VStack } from 'src/ui/ui-kit/VStack';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { showConfirmDialog } from 'src/ui/ui-kit/ModalDialogs/showConfirmDialog';
import { BottomSheetDialog } from 'src/ui/ui-kit/ModalDialogs/BottomSheetDialog';
import { DialogCloseButton } from 'src/ui/ui-kit/ModalDialogs/DialogTitle/DialogCloseButton';
import { invariant } from 'src/shared/invariant';
import { zeroizeAfterSubmission } from 'src/ui/shared/zeroize-submission';
import { accountPublicRPCPort } from 'src/ui/shared/channels';
import { Input } from 'src/ui/ui-kit/Input';
import { Button } from 'src/ui/ui-kit/Button';
import { ToggleSettingLine } from '../Settings/ToggleSettingsLine';
import { AUTO_LOCK_TIMER_OPTIONS_TITLES, AutoLockTimer } from './AutoLockTimer';
import { setupAccountPasskey } from './passkey';

function TouchIdSettings() {
  const [userValue, setUserValue] = useState<boolean | null>(null);
  const defaultValueQuery = useQuery({
    queryKey: ['account/getPasskeyEnabled'],
    queryFn: () => {
      return accountPublicRPCPort.request('getPasskeyEnabled');
    },
    useErrorBoundary: true,
    suspense: false,
  });
  const dialogRef = useRef<HTMLDialogElementInterface | null>(null);

  const userQuery = useQuery({
    queryKey: ['account/getExistingUser'],
    queryFn: () => {
      return accountPublicRPCPort.request('getExistingUser');
    },
    useErrorBoundary: true,
  });

  const handleSetupClick = useCallback(() => {
    invariant(dialogRef.current, 'Dialog element must be mounted');
    setUserValue(true);
    showConfirmDialog(dialogRef.current)
      .then(() => setUserValue(true))
      .catch(() => setUserValue(false));
  }, []);

  const setupTouchIdMutation = useMutation({
    mutationFn: async (password: string) => {
      invariant(userQuery.data, 'User must be defined');
      await accountPublicRPCPort.request('login', {
        user: userQuery.data,
        password,
      });
      return setupAccountPasskey(password);
    },
    onSuccess: () => {
      zeroizeAfterSubmission();
      if (!dialogRef.current) {
        return;
      }
      dialogRef.current.returnValue = 'confirm';
      dialogRef.current.close();
    },
  });

  const removeTouchIdMutation = useMutation({
    mutationFn: async () => {
      await accountPublicRPCPort.request('removeEncryptedPassword');
      setUserValue(false);
    },
  });

  const checked = userValue ?? defaultValueQuery.data ?? false;
  const disabled =
    userQuery.isLoading ||
    setupTouchIdMutation.isLoading ||
    removeTouchIdMutation.isLoading ||
    defaultValueQuery.isLoading;

  return (
    <>
      <ToggleSettingLine
        text="Unlock with Touch ID"
        checked={checked}
        disabled={disabled}
        onChange={(event) => {
          if (event.target.checked) {
            handleSetupClick();
          } else {
            removeTouchIdMutation.mutate();
          }
        }}
        detailText="Use biometrics (Touch ID) to securely sign in without typing in your password"
      />
      <BottomSheetDialog
        ref={dialogRef}
        height="fit-content"
        renderWhenOpen={() => {
          return (
            <>
              <DialogCloseButton
                style={{ position: 'absolute', top: 8, right: 8 }}
              />
              <VStack gap={24} style={{ paddingTop: 40 }}>
                <VStack gap={4}>
                  <UIText kind="body/accent">
                    Enter Password to enable login via TouchId
                  </UIText>
                  <UIText kind="small/regular" color="var(--neutral-500)">
                    Login with the password will be available too
                  </UIText>
                </VStack>
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    const password = new FormData(event.currentTarget).get(
                      'password'
                    ) as string | undefined;
                    if (!password) {
                      return;
                    }
                    setupTouchIdMutation.mutate(password);
                  }}
                >
                  <VStack
                    gap={16}
                    style={{ flexGrow: 1, gridTemplateRows: '1fr auto' }}
                  >
                    <VStack gap={4}>
                      <Input
                        autoFocus={true}
                        type="password"
                        name="password"
                        placeholder="Enter password"
                        required={true}
                      />
                      {setupTouchIdMutation.error ? (
                        <UIText
                          kind="caption/regular"
                          color="var(--negative-500)"
                        >
                          {(setupTouchIdMutation.error as Error).message ||
                            'unknown error'}
                        </UIText>
                      ) : null}
                    </VStack>
                    <Button disabled={setupTouchIdMutation.isLoading}>
                      {setupTouchIdMutation.isLoading
                        ? 'Checking...'
                        : 'Enable Touch Id'}
                    </Button>
                  </VStack>
                </form>
              </VStack>
            </>
          );
        }}
      />
    </>
  );
}

function SecurityMain() {
  const { globalPreferences } = useGlobalPreferences();
  useBackgroundKind({ kind: 'white' });

  return (
    <PageColumn>
      <PageTop />
      <Frame>
        <VStack gap={0}>
          <TouchIdSettings />
          <FrameListItemLink to="auto-lock-timer">
            <AngleRightRow>
              <HStack
                gap={24}
                alignItems="center"
                justifyContent="space-between"
              >
                <UIText kind="body/accent">Auto-Lock Timer</UIText>
                {globalPreferences ? (
                  <UIText kind="small/regular" color="var(--neutral-500)">
                    {
                      AUTO_LOCK_TIMER_OPTIONS_TITLES[
                        globalPreferences.autoLockTimeout
                      ]
                    }
                  </UIText>
                ) : (
                  <CircleSpinner />
                )}
              </HStack>
            </AngleRightRow>
          </FrameListItemLink>
        </VStack>
      </Frame>
    </PageColumn>
  );
}

export function Security() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ViewSuspense>
            <SecurityMain />
          </ViewSuspense>
        }
      />
      <Route
        path="/auto-lock-timer"
        element={
          <ViewSuspense>
            <AutoLockTimer />
          </ViewSuspense>
        }
      />
    </Routes>
  );
}

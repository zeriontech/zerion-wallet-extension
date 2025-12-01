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
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { ToggleSettingLine } from '../Settings/ToggleSettingsLine';
import type { PopoverToastHandle } from '../Settings/PopoverToast';
import { PopoverToast } from '../Settings/PopoverToast';
import { AUTO_LOCK_TIMER_OPTIONS_TITLES, AutoLockTimer } from './AutoLockTimer';
import { setupAccountPasskey, getPasskeyTitle, isMacOS } from './passkey';

function TouchIdSettings() {
  const toastRef = useRef<PopoverToastHandle>(null);
  const [userValue, setUserValue] = useState<boolean | null>(null);
  const passkeyTitle = getPasskeyTitle();

  // Check if passkeys are supported on this device
  const passkeyAvailabilityQuery = useQuery({
    queryKey: ['passkey/isSupported'],
    queryFn: async () => {
      if (!window.PublicKeyCredential) {
        return false;
      }
      try {
        const available =
          await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        return available;
      } catch {
        return false;
      }
    },
    staleTime: Infinity,
    cacheTime: Infinity,
  });

  const defaultValueQuery = useQuery({
    queryKey: ['account/getPasskeyEnabled'],
    queryFn: () => {
      return accountPublicRPCPort.request('getPasskeyEnabled');
    },
    useErrorBoundary: true,
    suspense: false,
  });
  const enablePasskeyDialogRef = useRef<HTMLDialogElementInterface | null>(
    null
  );
  const disablePasskeyDialogRef = useRef<HTMLDialogElementInterface | null>(
    null
  );

  const userQuery = useQuery({
    queryKey: ['account/getExistingUser'],
    queryFn: () => {
      return accountPublicRPCPort.request('getExistingUser');
    },
    useErrorBoundary: true,
  });

  const handleSetupClick = useCallback(() => {
    invariant(enablePasskeyDialogRef.current, 'Dialog element must be mounted');
    setUserValue(true);
    showConfirmDialog(enablePasskeyDialogRef.current)
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
      toastRef.current?.showToast();
      if (!enablePasskeyDialogRef.current) {
        return;
      }
      enablePasskeyDialogRef.current.returnValue = 'confirm';
      enablePasskeyDialogRef.current.close();
    },
  });

  const removeTouchIdMutation = useMutation({
    mutationFn: async () => {
      await accountPublicRPCPort.request('removePasskey');
      setUserValue(false);
    },
  });

  const checked = userValue ?? defaultValueQuery.data ?? false;
  const disabled =
    userQuery.isLoading ||
    setupTouchIdMutation.isLoading ||
    removeTouchIdMutation.isLoading ||
    defaultValueQuery.isLoading;

  // Hide the setting if passkeys are not supported
  if (!passkeyAvailabilityQuery.data) {
    return null;
  }

  return (
    <>
      {/* Currently, Windos Hello doesn't support PRF extension for passkeys */}
      {/* TODO: Research other passkey providers and enable them */}
      {isMacOS() ? (
        <ToggleSettingLine
          text={`Unlock with ${passkeyTitle}`}
          checked={checked}
          disabled={disabled}
          onChange={(event) => {
            if (event.target.checked) {
              handleSetupClick();
            } else {
              if (!disablePasskeyDialogRef.current) {
                return;
              }
              showConfirmDialog(disablePasskeyDialogRef.current).then(() => {
                removeTouchIdMutation.mutate();
              });
            }
          }}
          detailText={`Use biometrics (${passkeyTitle}) to securely sign in without typing in your password`}
        />
      ) : null}
      <BottomSheetDialog ref={disablePasskeyDialogRef} height="fit-content">
        <VStack gap={8}>
          <form method="dialog">
            <UIText kind="headline/h3">Turn Off {passkeyTitle} Unlock?</UIText>
            <Spacer height={8} />
            <UIText kind="body/regular">
              You will be able to log in only with your password. You can turn
              this back on at any time.
            </UIText>
            <Spacer height={16} />
            <Button kind="danger" value="confirm" style={{ width: '100%' }}>
              Turn Off {passkeyTitle}
            </Button>
          </form>
          <form method="dialog">
            <Button kind="regular" value="cancel" style={{ width: '100%' }}>
              Back
            </Button>
          </form>
        </VStack>
      </BottomSheetDialog>
      <BottomSheetDialog
        ref={enablePasskeyDialogRef}
        height="fit-content"
        renderWhenOpen={() => {
          return (
            <>
              <DialogCloseButton
                style={{ position: 'absolute', top: 8, right: 8 }}
              />
              <VStack gap={24}>
                <VStack gap={8}>
                  <UIText kind="headline/h1">Enter Password</UIText>
                  <UIText kind="body/regular">
                    Verification is required to enable login via {passkeyTitle}
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
                    gap={32}
                    style={{ flexGrow: 1, gridTemplateRows: '1fr auto' }}
                  >
                    <VStack gap={4}>
                      <Input
                        autoFocus={true}
                        type="password"
                        name="password"
                        placeholder="Password"
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
                      {setupTouchIdMutation.isLoading ? (
                        <div
                          style={{ display: 'flex', justifyContent: 'center' }}
                        >
                          <CircleSpinner />
                        </div>
                      ) : (
                        `Enable ${passkeyTitle}`
                      )}
                    </Button>
                  </VStack>
                </form>
              </VStack>
            </>
          );
        }}
      />
      <PopoverToast
        ref={toastRef}
        style={{
          bottom: 'calc(100px + var(--technical-panel-bottom-height, 0px))',
        }}
      >
        {passkeyTitle} is enabled.
      </PopoverToast>
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

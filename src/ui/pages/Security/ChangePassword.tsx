import React, { useLayoutEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Route, Routes, useNavigate } from 'react-router-dom';
import { getError } from 'src/shared/errors/getError';
import { invariant } from 'src/shared/invariant';
import { useBackgroundKind } from 'src/ui/components/Background';
import { whiteBackgroundKind } from 'src/ui/components/Background/Background';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageHeading } from 'src/ui/components/PageHeading';
import { PageTop } from 'src/ui/components/PageTop';
import { ViewSuspense } from 'src/ui/components/ViewSuspense';
import { accountPublicRPCPort } from 'src/ui/shared/channels';
import { zeroizeAfterSubmission } from 'src/ui/shared/zeroize-submission';
import { Button } from 'src/ui/ui-kit/Button';
import { Input } from 'src/ui/ui-kit/Input';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { ChangePasswordSuccess } from './ChangePasswordSuccess';

function CustomValidityInput({
  customValidity,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { customValidity: string }) {
  const ref = useRef<HTMLInputElement>(null);
  useLayoutEffect(() => {
    ref.current?.setCustomValidity(customValidity);
  }, [customValidity]);
  return <Input {...props} ref={ref} />;
}

function ChangePassword() {
  useBackgroundKind(whiteBackgroundKind);
  const navigate = useNavigate();
  const { data: user } = useQuery({
    queryKey: ['account/getExistingUser'],
    queryFn: () => accountPublicRPCPort.request('getExistingUser'),
  });
  const changePasswordMutation = useMutation({
    mutationFn: async ({
      currentPassword,
      newPassword,
    }: {
      currentPassword: string;
      newPassword: string;
    }) => {
      invariant(user, 'User must be defined');
      await accountPublicRPCPort.request('changePassword', {
        user,
        currentPassword,
        newPassword,
      });
    },
    onSuccess: async () => {
      zeroizeAfterSubmission();
      navigate('./success');
    },
  });
  const [formData, setFormData] = useState<FormData | null>(null);
  const submitError = changePasswordMutation.isError
    ? getError(changePasswordMutation.error)
    : null;
  const incorrectPassword = submitError?.message === 'Incorrect password';
  return (
    <PageColumn>
      <PageTop />
      <PageHeading>Change Password</PageHeading>
      <PageTop />
      <form
        onChange={(event) => {
          const fd = new FormData(event.currentTarget);
          setFormData(fd);
        }}
        onSubmit={(event) => {
          event.preventDefault();
          const fd = new FormData(event.currentTarget);
          const currentPassword = fd.get('currentPassword') as
            | string
            | undefined;
          const newPassword = fd.get('newPassword') as string | undefined;
          invariant(currentPassword, 'currentPassword is required');
          invariant(newPassword, 'newPassword is required');
          changePasswordMutation.mutate({ currentPassword, newPassword });
        }}
      >
        <VStack gap={24}>
          <label style={{ all: 'unset' }}>
            <VStack gap={4}>
              <UIText kind="body/regular">Current password</UIText>
              <VStack gap={4}>
                <Input
                  autoFocus={true}
                  type="password"
                  name="currentPassword"
                  placeholder="Password"
                  required={true}
                />
                {incorrectPassword ? (
                  <UIText kind="caption/regular" color="var(--negative-500)">
                    Incorrect Password
                  </UIText>
                ) : null}
              </VStack>
            </VStack>
          </label>
          <label style={{ all: 'unset' }}>
            <VStack gap={4}>
              <UIText kind="body/regular">Enter new password</UIText>
              <VStack gap={4}>
                <Input
                  type="password"
                  name="newPassword"
                  placeholder="Set new or verify existing one"
                  required={true}
                />
              </VStack>
            </VStack>
          </label>
          <label style={{ all: 'unset' }}>
            <VStack gap={4}>
              <UIText kind="body/regular">Confirm new password</UIText>
              <VStack gap={4}>
                <CustomValidityInput
                  type="password"
                  name="confirmPassword"
                  placeholder="Enter the new password again"
                  required={true}
                  customValidity={
                    formData?.get('confirmPassword') === ''
                      ? ''
                      : formData?.get('confirmPassword') !==
                        formData?.get('newPassword')
                      ? 'Passwords do not match'
                      : ''
                  }
                />
              </VStack>
            </VStack>
          </label>

          <VStack gap={8} style={{ textAlign: 'center' }}>
            <UIText kind="body/regular" color="var(--negative-500)">
              {submitError && !incorrectPassword ? submitError.message : null}
            </UIText>
            <Button disabled={changePasswordMutation.isLoading}>Update</Button>
          </VStack>
        </VStack>
      </form>
    </PageColumn>
  );
}

export function ChangePasswordRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ViewSuspense>
            <ChangePassword />
          </ViewSuspense>
        }
      />
      <Route
        path="/success"
        element={
          <ViewSuspense>
            <ChangePasswordSuccess />
          </ViewSuspense>
        }
      />
    </Routes>
  );
}

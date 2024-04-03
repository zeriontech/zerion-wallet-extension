import React, { useId, useMemo } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import type { PublicUser } from 'src/shared/types/User';
import { PageBottom } from 'src/ui/components/PageBottom';
import { PageColumn } from 'src/ui/components/PageColumn';
import { accountPublicRPCPort } from 'src/ui/shared/channels';
import { Button } from 'src/ui/ui-kit/Button';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import * as s from 'src/ui/style/helpers.module.css';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import { Input } from 'src/ui/ui-kit/Input';
import { HStack } from 'src/ui/ui-kit/HStack';
import ZerionLogo from 'jsx:src/ui/assets/zerion-squircle.svg';
import { useBodyStyle } from 'src/ui/components/Background/Background';
import { zeroizeAfterSubmission } from 'src/ui/shared/zeroize-submission';

export function Login() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const {
    data: user,
    isLoading,
    error,
    isError,
  } = useQuery({
    queryKey: ['account/getExistingUser'],
    queryFn: () => {
      return accountPublicRPCPort.request('getExistingUser');
    },
  });
  const formId = useId();
  const inputId = useId();

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
    onSuccess() {
      zeroizeAfterSubmission();
      navigate(params.get('next') || '/', {
        // If user clicks "back" when we redirect them,
        // we should take them to overview, not back to the login view
        replace: true,
      });
    },
  });

  useBodyStyle(useMemo(() => ({ backgroundColor: 'var(--white)' }), []));
  if (isLoading) {
    return null;
  }
  if (isError) {
    throw error;
  }
  if (!user) {
    return <Navigate to="/" replace={true} />;
  }
  return (
    <PageColumn>
      <Spacer height={56} />
      <HStack
        gap={16}
        alignItems="center"
        style={{ placeSelf: 'center', alignSelf: 'center' }}
      >
        <ZerionLogo style={{ width: 54, height: 54 }} />
      </HStack>
      <Spacer height={86} />
      <form
        id={formId}
        onSubmit={(event) => {
          event.preventDefault();
          const password = new FormData(event.currentTarget).get('password') as
            | string
            | undefined;
          if (!password) {
            return;
          }
          if (!user) {
            throw new Error('Cannot login: user not found');
          }
          loginMutation.mutate({ user, password });
        }}
      >
        <VStack gap={24}>
          <UIText
            as="label"
            htmlFor={inputId}
            kind="headline/h1"
            style={{ textAlign: 'center' }}
          >
            Enter Password
          </UIText>
          <VStack gap={4}>
            <Input
              id={inputId}
              autoFocus={true}
              type="password"
              name="password"
              placeholder="password"
              required={true}
            />
            {loginMutation.error ? (
              <UIText kind="caption/regular" color="var(--negative-500)">
                {(loginMutation.error as Error).message || 'unknown error'}
              </UIText>
            ) : null}
          </VStack>
          <UIText
            as={UnstyledLink}
            to="/forgot-password"
            kind="body/accent"
            color="var(--neutral-500)"
            style={{ textAlign: 'center' }}
          >
            <span className={s.hoverUnderline}>Forgot password?</span>
          </UIText>
        </VStack>
      </form>
      <Spacer height={24} />
      <Button
        style={{ marginTop: 'auto' }}
        form={formId}
        disabled={loginMutation.isLoading}
      >
        {loginMutation.isLoading ? 'Checking...' : 'Unlock'}
      </Button>
      <PageBottom />
    </PageColumn>
  );
}

import React, { useMemo } from 'react';
import { useMutation, useQuery } from 'react-query';
import { useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import type { PublicUser } from 'src/shared/types/PublicUser';
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
import ZerionLogoText from 'jsx:src/ui/assets/zerion-logo-text.svg';
import NewWindowIcon from 'jsx:src/ui/assets/new-window.svg';
import { apostrophe } from 'src/ui/shared/typography';
import backgroundArts2 from 'src/ui/assets/background-arts-2.svg';
import { useBodyStyle } from 'src/ui/components/Background/Background';
import { UnstyledAnchor } from 'src/ui/ui-kit/UnstyledAnchor';

export function Login() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const {
    data: user,
    isLoading,
    error,
    isError,
  } = useQuery('user', () => {
    return accountPublicRPCPort.request('getExistingUser');
  });
  const loginMutation = useMutation(
    ({ user, password }: { user: PublicUser; password: string }) =>
      accountPublicRPCPort.request('login', { user, password }),
    {
      onSuccess() {
        navigate(params.get('next') || '/overview');
      },
    }
  );
  useBodyStyle(
    useMemo(
      () => ({
        backgroundColor: 'var(--neutral-100)',
        backgroundImage: `url(${backgroundArts2})`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
      }),
      []
    )
  );
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
        <ZerionLogoText style={{ height: 17 }} />
      </HStack>
      <Spacer height={86} />
      <VStack gap={8} style={{ textAlign: 'center' }}>
        <UIText kind="headline/h1">Welcome back!</UIText>
        <UIText kind="body/regular">{`It${apostrophe}s nice to see you again`}</UIText>
      </VStack>
      <Spacer height={24} />
      <form
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
        <VStack gap={16}>
          <VStack gap={4}>
            <Input
              style={{ backgroundColor: 'var(--white)' }}
              autoFocus={true}
              type="password"
              name="password"
              placeholder="password"
              required={true}
            />
            {loginMutation.error ? (
              <UIText kind="caption/reg" color="var(--negative-500)">
                {(loginMutation.error as Error).message || 'unknown error'}
              </UIText>
            ) : null}
          </VStack>
          <Button disabled={loginMutation.isLoading}>
            {loginMutation.isLoading ? 'Checking...' : 'Unlock'}
          </Button>
          <UIText
            as={UnstyledLink}
            to="/forgot-password"
            kind="body/accent"
            color="var(--primary)"
            style={{ textAlign: 'center' }}
          >
            <span className={s.hoverUnderline}>Forgot password?</span>
          </UIText>
        </VStack>
      </form>
      <div style={{ marginTop: 'auto', textAlign: 'center' }}>
        <Button
          as={UnstyledAnchor}
          kind="regular"
          color="var(--neutral-500)"
          href="https://app.zerion.io"
          target="_blank"
        >
          <HStack gap={8} alignItems="center">
            <span>app.zerion.io</span>
            <NewWindowIcon style={{ width: 20, height: 20 }} />
          </HStack>
        </Button>
      </div>
      <PageBottom />
    </PageColumn>
  );
}

import React from 'react';
import { useMutation, useQuery } from 'react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { PublicUser } from 'src/background/account/Account';
import { Background } from 'src/ui/components/Background';
import { PageBottom } from 'src/ui/components/PageBottom';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { accountPublicRPCPort } from 'src/ui/shared/channels';
import { Button } from 'src/ui/ui-kit/Button';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import * as s from 'src/ui/style/helpers.module.css';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import { Input } from 'src/ui/ui-kit/Input';

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
  if (isLoading) {
    return null;
  }
  if (isError) {
    throw error;
  }
  if (!user) {
    throw new Error('Login page: User not found');
  }
  return (
    <Background backgroundKind="white">
      <PageColumn>
        <PageTop />
        <PageTop />
        <UIText kind="h/5_sb" style={{ textAlign: 'center' }}>
          Login
        </UIText>
        <UIText kind="caption/reg">next: {params.get('next')}</UIText>
        <Spacer height={24} />
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const password = new FormData(event.currentTarget).get(
              'password'
            ) as string | undefined;
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
            <div style={{ textAlign: 'center' }}>
              <UIText
                as={UnstyledLink}
                to="/create-account"
                kind="button/s_reg"
                color="var(--primary)"
              >
                <span className={s.hoverUnderline}>Or create new account</span>
              </UIText>
              <UIText kind="button/s_reg">
                (creating new account will erase the current one)
              </UIText>
            </div>
          </VStack>
        </form>
        <PageBottom />
      </PageColumn>
    </Background>
  );
}

import React, { useId } from 'react';
import { useMutation, useQuery } from 'react-query';
import { PublicUser } from 'src/shared/types/PublicUser';
import { accountPublicRPCPort } from 'src/ui/shared/channels';
import { Button } from 'src/ui/ui-kit/Button';
import { Input } from 'src/ui/ui-kit/Input';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';

export function VerifyUser({
  text = 'Enter password',
  onSuccess,
}: {
  text?: string;
  onSuccess: () => void;
}) {
  const { data: user, isLoading } = useQuery(
    'user',
    () => {
      return accountPublicRPCPort.request('getExistingUser');
    },
    { useErrorBoundary: true }
  );
  const loginMutation = useMutation(
    ({ user, password }: { user: PublicUser; password: string }) =>
      accountPublicRPCPort.request('login', { user, password }),
    { onSuccess }
  );
  const inputId = useId();
  if (isLoading) {
    return null;
  }
  return (
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
      <Spacer height={32} />
      <VStack gap={16}>
        <UIText kind="h/6_reg" as="label" htmlFor={inputId}>
          {text}
        </UIText>
        <VStack gap={4}>
          <Input
            id={inputId}
            autoFocus={true}
            type="password"
            name="password"
            placeholder="password"
            required={true}
            style={{
              backgroundColor: 'var(--neutral-200)',
              padding: '7px 11px',
              border: '1px solid var(--neutral-200)',
              borderRadius: 8,
            }}
          />
          {loginMutation.error ? (
            <UIText kind="caption/reg" color="var(--negative-500)">
              {(loginMutation.error as Error).message || 'unknown error'}
            </UIText>
          ) : null}
        </VStack>
        <Button disabled={loginMutation.isLoading}>
          {loginMutation.isLoading ? 'Checking...' : 'Confirm'}
        </Button>
      </VStack>
    </form>
  );
}

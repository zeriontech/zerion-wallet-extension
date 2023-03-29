import React, { useId } from 'react';
import { useMutation, useQuery } from 'react-query';
import { PublicUser } from 'src/shared/types/User';
import { accountPublicRPCPort } from 'src/ui/shared/channels';
import { Button } from 'src/ui/ui-kit/Button';
import { Input } from 'src/ui/ui-kit/Input';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';

export function VerifyUser({
  text,
  style,
  onSuccess,
}: {
  text?: React.ReactNode;
  style?: React.CSSProperties;
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
      style={style}
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
        <VStack gap={8}>
          <VStack gap={4}>
            <Input
              id={inputId}
              autoFocus={true}
              type="password"
              name="password"
              placeholder="Enter password"
              required={true}
            />
            {loginMutation.error ? (
              <UIText kind="caption/regular" color="var(--negative-500)">
                {(loginMutation.error as Error).message || 'unknown error'}
              </UIText>
            ) : null}
          </VStack>
        </VStack>
        <Button disabled={loginMutation.isLoading}>
          {loginMutation.isLoading ? 'Checking...' : 'Confirm'}
        </Button>
        {text ? (
          <UIText
            color="var(--neutral-500)"
            kind="small/regular"
            as="label"
            htmlFor={inputId}
          >
            {text}
          </UIText>
        ) : null}
      </VStack>
    </form>
  );
}

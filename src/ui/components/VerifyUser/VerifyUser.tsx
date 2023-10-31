import React, { useId } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { PublicUser } from 'src/shared/types/User';
import { accountPublicRPCPort } from 'src/ui/shared/channels';
import { zeroizeAfterSubmission } from 'src/ui/shared/zeroize-submission';
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
  const { data: user, isLoading } = useQuery({
    queryKey: ['account/getExistingUser'],
    queryFn: () => {
      return accountPublicRPCPort.request('getExistingUser');
    },
    useErrorBoundary: true,
  });
  const loginMutation = useMutation({
    mutationFn: ({
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
      onSuccess();
    },
  });
  const inputId = useId();
  if (isLoading) {
    return null;
  }
  return (
    <VStack
      gap={32}
      style={{
        flexGrow: 1,
        alignContent: 'stretch',
        alignItems: 'stretch',
        gridTemplateRows: 'auto 1fr',
      }}
    >
      <VStack gap={4}>
        <UIText kind="headline/h1">Enter Password</UIText>
        <UIText kind="body/regular">{text}</UIText>
      </VStack>
      <form
        style={{
          justifySelf: 'stretch',
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          ...style,
        }}
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
        <VStack gap={16} style={{ flexGrow: 1, gridTemplateRows: '1fr auto' }}>
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
          <Button disabled={loginMutation.isLoading}>
            {loginMutation.isLoading ? 'Checking...' : 'Unlock'}
          </Button>
        </VStack>
      </form>
    </VStack>
  );
}

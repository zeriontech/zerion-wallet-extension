import React from 'react';
import { useMutation } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { Background } from 'src/ui/components/Background';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { PageBottom } from 'src/ui/components/PageBottom';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageHeading } from 'src/ui/components/PageHeading';
import { PageTop } from 'src/ui/components/PageTop';
import { accountPublicRPCPort } from 'src/ui/shared/channels';
import { Button } from 'src/ui/ui-kit/Button';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';

export function CreateAccount() {
  const navigate = useNavigate();
  const createUserMutation = useMutation(
    ({ password }: { password: string }) =>
      accountPublicRPCPort.request('createUser', { password }),
    {
      onSuccess() {
        navigate('/get-started');
      },
    }
  );
  console.log({ mutationData: createUserMutation.data });
  return (
    <Background backgroundKind="white">
      <PageColumn>
        <PageTop />
        <NavigationTitle title={null} />
        <PageHeading>Create Password</PageHeading>
        <UIText kind="subtitle/s_reg" color="var(--neutral-500)">
          Protect your wallet by setting a password
        </UIText>
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
            createUserMutation.mutate({ password });
          }}
        >
          <VStack gap={16}>
            <VStack gap={4}>
              <input
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
              {createUserMutation.error ? (
                <UIText kind="caption/reg" color="var(--negative-500)">
                  {(createUserMutation.error as Error).message ||
                    'unknown error'}
                </UIText>
              ) : null}
            </VStack>
            <Button>Confirm</Button>
          </VStack>
        </form>
        <PageBottom />
      </PageColumn>
    </Background>
  );
}

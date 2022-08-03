import React from 'react';
import { useMutation, useQuery } from 'react-query';
import { Link, useSearchParams } from 'react-router-dom';
import type { PublicUser } from 'src/shared/types/PublicUser';
import { Background } from 'src/ui/components/Background';
import { FillView } from 'src/ui/components/FillView';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageHeading } from 'src/ui/components/PageHeading';
import { PageTop } from 'src/ui/components/PageTop';
import { accountPublicRPCPort, walletPort } from 'src/ui/shared/channels';
import { prepareUserInputSeedOrPrivateKey } from 'src/ui/shared/prepareUserInputSeedOrPrivateKey';
import { useMnemonicQuery } from 'src/ui/shared/requests/useMnemonicQuery';
import { Button } from 'src/ui/ui-kit/Button';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { Surface } from 'src/ui/ui-kit/Surface';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { DecorativeMessage } from '../GetStarted/components/DecorativeMessage';

function Initial({ onSubmit }: { onSubmit: () => void }) {
  return (
    <>
      <NavigationTitle title={null} />
      <PageTop />
      <PageHeading>Backup Your Wallet</PageHeading>

      <Spacer height={32} />

      <VStack gap={16}>
        <VStack gap={8}>
          <DecorativeMessage
            text={
              <UIText kind="subtitle/m_reg">
                Hi there! 👋 We're about to display your recovery phrase that
                will help secure your wallet and funds.
              </UIText>
            }
          />
          <DecorativeMessage
            isConsecutive={true}
            text={
              <UIText kind="subtitle/m_reg">
                🔐 Backing up your wallet with a recovery phrase helps ensure
                you can access your assets even if you uninstall the extension
                or stop using Zerion
              </UIText>
            }
          />
          <DecorativeMessage
            isConsecutive={true}
            text={
              <UIText kind="subtitle/m_reg">
                ☝️ Make sure you're ready to write down this recovery phrase and
                have a safe place to keep it. If you lose it, you'll never be
                able to access your funds again.
              </UIText>
            }
          />
        </VStack>
        <Button autoFocus={true} onClick={onSubmit}>
          Show Recovery Phrase
        </Button>
      </VStack>
    </>
  );
}

function VerifyUser({ onSuccess }: { onSuccess: () => void }) {
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
        <UIText kind="h/6_reg">Enter password</UIText>
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
          {loginMutation.error ? (
            <UIText kind="caption/reg" color="var(--negative-500)">
              {(loginMutation.error as Error).message || 'unknown error'}
            </UIText>
          ) : null}
        </VStack>
        <Button>{loginMutation.isLoading ? 'Checking...' : 'Confirm'}</Button>
      </VStack>
    </form>
  );
}

function RecoveryPhrase({
  groupId,
  onSubmit,
}: {
  groupId: string;
  onSubmit: () => void;
}) {
  const { data: mnemonic, isLoading } = useMnemonicQuery({ groupId });
  if (isLoading) {
    return <p>Loading...</p>;
  }
  if (!mnemonic) {
    throw new Error('Could not get mnemonic');
  }
  return (
    <div>
      <Spacer height={32} />

      <VStack gap={24}>
        <UIText kind="subtitle/l_reg">First, write this down</UIText>
        <Surface padding={16}>
          <UIText
            kind="button/l_med"
            style={{ wordSpacing: 10, lineHeight: 1.6 }}
          >
            {mnemonic.phrase}
          </UIText>
        </Surface>
        <VStack gap={12}>
          <UIText kind="subtitle/l_reg">Next,</UIText>
          <Button autoFocus={true} onClick={onSubmit}>
            Verify Backup
          </Button>
        </VStack>
      </VStack>
    </div>
  );
}

function VerifyBackup({
  groupId,
  onSuccess,
}: {
  groupId: string;
  onSuccess: () => void;
}) {
  const verifyMutation = useMutation(
    async (value: string) => {
      const mnemonic = await walletPort.request('getRecoveryPhrase', {
        groupId,
      });
      if (!mnemonic) {
        throw new Error('Could not get mnemonic');
      }
      if (value !== mnemonic.phrase) {
        throw new Error('Wrong phrase');
      }
      return true;
    },
    {
      onSuccess: async () => {
        if (!groupId) {
          throw new Error('No groupId');
        }
        await walletPort.request('updateLastBackedUp', { groupId });
        onSuccess();
      },
    }
  );
  return (
    <div>
      <Spacer height={32} />
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const value = new FormData(event.currentTarget).get(
            'seedOrPrivateKey'
          );
          verifyMutation.mutate(
            prepareUserInputSeedOrPrivateKey(value as string)
          );
        }}
      >
        <VStack gap={12}>
          <VStack gap={4}>
            <UIText kind="subtitle/l_reg">Recovery Phrase</UIText>
            <textarea
              autoFocus={true}
              name="seedOrPrivateKey"
              required={true}
              rows={3}
              placeholder="Enter seed phrase or a private key"
              style={{
                display: 'block',
                width: '100%',
                color: 'var(--black)',
                resize: 'vertical',
                backgroundColor: 'var(--white)',
                padding: '7px 11px',
                border: '1px solid var(--neutral-200)',
                borderRadius: 8,
              }}
            />
            {verifyMutation.error ? (
              <UIText kind="caption/reg" color="var(--negative-500)">
                {(verifyMutation.error as Error).message || 'unknown error'}
              </UIText>
            ) : null}
          </VStack>
          <Button autoFocus={true}>Verify</Button>
        </VStack>
      </form>
    </div>
  );
}

function VerifySuccess() {
  return (
    <FillView>
      <VStack gap={8} style={{ placeItems: 'center' }}>
        <span style={{ fontSize: 48 }}>🥳</span>
        <UIText kind="button/m_reg">
          The recovery phrase you have is correct!
        </UIText>
        <Button as={Link} to="/overview">
          Return to Main Screen
        </Button>
      </VStack>
    </FillView>
  );
}

export function BackupWallet() {
  const [params, setSearchParams] = useSearchParams();
  const groupId = params.get('groupId');
  if (!groupId) {
    throw new Error('Group Id is required for this view');
  }
  return (
    <Background backgroundColor="var(--background)">
      <PageColumn>
        {params.has('step') ? null : (
          <Initial
            onSubmit={() => setSearchParams({ step: 'verifyUser', groupId })}
          />
        )}
        {params.get('step') === 'verifyUser' ? (
          <VerifyUser
            onSuccess={() =>
              setSearchParams(
                { step: 'recoveryPhrase', groupId },
                { replace: true }
              )
            }
          />
        ) : null}
        {params.get('step') === 'recoveryPhrase' ? (
          <RecoveryPhrase
            groupId={groupId}
            onSubmit={() => setSearchParams({ step: 'verifyBackup', groupId })}
          />
        ) : null}
        {params.get('step') === 'verifyBackup' ? (
          <VerifyBackup
            groupId={groupId}
            onSuccess={() =>
              setSearchParams({ step: 'verifySuccess', groupId })
            }
          />
        ) : null}
        {params.get('step') === 'verifySuccess' ? <VerifySuccess /> : null}
      </PageColumn>
    </Background>
  );
}

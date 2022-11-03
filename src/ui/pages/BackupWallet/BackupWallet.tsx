import React from 'react';
import { useMutation, useQuery } from 'react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { SeedType } from 'src/shared/SeedType';
import { Background } from 'src/ui/components/Background';
import { FillView } from 'src/ui/components/FillView';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageHeading } from 'src/ui/components/PageHeading';
import { PageTop } from 'src/ui/components/PageTop';
import { VerifyUser } from 'src/ui/components/VerifyUser';
import { walletPort } from 'src/ui/shared/channels';
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
            style={{ animationDelay: '300ms' }}
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
            style={{ animationDelay: '600ms' }}
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
        <span style={{ fontSize: 48, lineHeight: 1 }}>🥳</span>
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
  const { data: walletGroup, isLoading } = useQuery(
    `wallet/uiGetWalletGroup/${groupId}`,
    () => walletPort.request('uiGetWalletGroup', { groupId }),
    { useErrorBoundary: true }
  );
  if (isLoading) {
    return null;
  }
  if (walletGroup?.walletContainer.seedType === SeedType.privateKey) {
    return (
      <FillView>
        <UIText
          kind="subtitle/l_reg"
          color="var(--neutral-500)"
          style={{ padding: 20, textAlign: 'center' }}
        >
          Backup View for Private Key wallet is not implemented
        </UIText>
      </FillView>
    );
  }
  return (
    <PageColumn>
      {params.has('step') ? null : (
        <Initial
          onSubmit={() => setSearchParams({ step: 'verifyUser', groupId })}
        />
      )}
      {params.get('step') === 'verifyUser' ? (
        <Background backgroundKind="white">
          <VerifyUser
            onSuccess={() =>
              setSearchParams(
                { step: 'recoveryPhrase', groupId },
                { replace: true }
              )
            }
          />
        </Background>
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
          onSuccess={() => setSearchParams({ step: 'verifySuccess', groupId })}
        />
      ) : null}
      {params.get('step') === 'verifySuccess' ? <VerifySuccess /> : null}
    </PageColumn>
  );
}

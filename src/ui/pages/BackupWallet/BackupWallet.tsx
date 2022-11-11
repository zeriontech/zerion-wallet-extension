import React, { useEffect, useId, useRef } from 'react';
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
import ArrowRightIcon from 'jsx:src/ui/assets/arrow-right.svg';
import { HStack } from 'src/ui/ui-kit/HStack';
import { PageBottom } from 'src/ui/components/PageBottom';
import { ViewLoading } from 'src/ui/components/ViewLoading';
import { useCopyToClipboard } from 'src/ui/shared/useCopyToClipboard';
import CopyIcon from 'jsx:src/ui/assets/copy.svg';
import { ZStack } from 'src/ui/ui-kit/ZStack';
import { WithConfetti } from '../GetStarted/components/DecorativeMessage/DecorativeMessage';
import { DecorativeMessage } from '../GetStarted/components/DecorativeMessage';

function Initial({ onSubmit }: { onSubmit: () => void }) {
  return (
    <PageColumn>
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
      </VStack>
      <Button style={{ marginTop: 'auto' }} autoFocus={true} onClick={onSubmit}>
        Show Recovery Phrase
      </Button>
      <PageBottom />
    </PageColumn>
  );
}

function RecoveryPhrase({
  groupId,
  onSubmit,
}: {
  groupId: string;
  onSubmit: ({ didCopy }: { didCopy: boolean }) => void;
}) {
  const { data: mnemonic, isLoading } = useMnemonicQuery({ groupId });
  const { handleCopy, isSuccess: isCopySuccess } = useCopyToClipboard({
    text: mnemonic?.phrase || '',
  });
  const didCopyRef = useRef(false);
  const copyRecoveryPhrase = () => {
    didCopyRef.current = true;
    handleCopy();
  };
  useEffect(() => {
    // listen to copy event. If it occurred on this view,
    // we will clear clipboard before navigating to next view
    const handler = () => {
      didCopyRef.current = true;
    };
    window.addEventListener('copy', handler);
    return () => window.removeEventListener('copy', handler);
  }, []);
  if (isLoading) {
    return <ViewLoading />;
  }
  if (!mnemonic) {
    throw new Error('Could not get mnemonic');
  }
  return (
    <PageColumn>
      <PageTop />

      <NavigationTitle title="Write this down" />
      <VStack gap={16}>
        <Surface padding={16}>
          <UIText
            kind="button/l_med"
            style={{
              wordSpacing: 10,
              lineHeight: 1.6,
              textTransform: 'uppercase',
            }}
          >
            {mnemonic.phrase}
          </UIText>
        </Surface>
        <div>
          <Button
            kind="regular"
            type="button"
            onClick={copyRecoveryPhrase}
            style={{ paddingLeft: 28, paddingRight: 28 }}
          >
            <HStack gap={8}>
              {isCopySuccess ? (
                <div
                  style={{
                    width: 20,
                    height: 20,
                    color: 'var(--positive-500)',
                  }}
                >
                  ✔
                </div>
              ) : (
                <CopyIcon style={{ display: 'block', width: 20, height: 20 }} />
              )}
              <ZStack
                hideLowerElements={true}
                justifyContent="start"
                style={{ textAlign: 'left' }}
              >
                {isCopySuccess ? <span>Copied!</span> : null}
                <span aria-hidden={isCopySuccess}>Copy to Clipboard</span>
              </ZStack>
            </HStack>
          </Button>
        </div>
      </VStack>
      <Button
        style={{ marginTop: 'auto' }}
        autoFocus={true}
        onClick={() => onSubmit({ didCopy: didCopyRef.current })}
      >
        <HStack gap={8} justifyContent="center">
          <span>Verify Backup</span>
          <ArrowRightIcon />
        </HStack>
      </Button>
      <PageBottom />
    </PageColumn>
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
  const textAreaId = useId();
  const autoFocusRef = useRef<HTMLTextAreaElement | null>(null);
  useEffect(() => {
    autoFocusRef.current?.focus();
  }, []);
  return (
    <PageColumn>
      <form
        style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}
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
        <PageTop />
        <VStack gap={12}>
          <VStack gap={4}>
            <UIText kind="subtitle/l_reg" as="label" htmlFor={textAreaId}>
              Recovery Phrase
            </UIText>
            <textarea
              ref={autoFocusRef}
              autoFocus={true}
              name="seedOrPrivateKey"
              required={true}
              id={textAreaId}
              rows={14}
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
                fontSize: 16,
              }}
            />
            {verifyMutation.error ? (
              <UIText kind="caption/reg" color="var(--negative-500)">
                {(verifyMutation.error as Error).message || 'unknown error'}
              </UIText>
            ) : null}
          </VStack>
        </VStack>
        <Button autoFocus={true} style={{ marginTop: 'auto' }}>
          Verify
        </Button>
        <PageBottom />
      </form>
    </PageColumn>
  );
}

function VerifySuccess({ seedType }: { seedType: SeedType }) {
  return (
    <PageColumn>
      <WithConfetti
        fireDelay={0}
        originY={0.55}
        leftOriginX={0.25}
        rightOriginX={0.75}
        gravity={0.2}
        decay={0.84}
        particleCount={50}
        startVelocity={20}
      >
        <FillView>
          <VStack
            gap={24}
            style={{
              placeItems: 'center',
              textAlign: 'center',
              paddingLeft: 52,
              paddingRight: 52,
            }}
          >
            <span style={{ fontSize: 48, lineHeight: 1 }}>🥳</span>
            <UIText kind="headline/h1">Nicely done!</UIText>
            <UIText kind="body/regular" color="var(--neutral-500)">
              Find a secure location for your{' '}
              {seedType === SeedType.privateKey
                ? 'private key'
                : 'recovery phrase'}{' '}
              and remember:
              <br />
              <UIText kind="body/accent" inline={true}>
                never share it with anyone
              </UIText>
            </UIText>
          </VStack>
        </FillView>
        <Button style={{ marginTop: 'auto' }} as={Link} to="/overview">
          Finish
        </Button>
        <PageBottom />
      </WithConfetti>
    </PageColumn>
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
  const { handleCopy: emptyClipboard } = useCopyToClipboard({
    text: 'You can copy and paste recovery phrase from where you saved it',
  });
  if (isLoading || !walletGroup) {
    return null;
  }
  const { seedType } = walletGroup.walletContainer;
  if (seedType === SeedType.privateKey) {
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
    <>
      {params.has('step') ? null : (
        <Initial
          onSubmit={() => setSearchParams({ step: 'verifyUser', groupId })}
        />
      )}
      {params.get('step') === 'verifyUser' ? (
        <PageColumn>
          <Background backgroundKind="white">
            <NavigationTitle title="Enter password" />
            <FillView adjustForNavigationBar={true}>
              <VerifyUser
                style={{ justifySelf: 'stretch' }}
                onSuccess={() =>
                  setSearchParams(
                    { step: 'recoveryPhrase', groupId },
                    { replace: true }
                  )
                }
              />
            </FillView>
          </Background>
        </PageColumn>
      ) : null}
      {params.get('step') === 'recoveryPhrase' ? (
        <RecoveryPhrase
          groupId={groupId}
          onSubmit={({ didCopy }) => {
            if (didCopy) {
              emptyClipboard();
            }
            setSearchParams({ step: 'verifyBackup', groupId });
          }}
        />
      ) : null}
      {params.get('step') === 'verifyBackup' ? (
        <VerifyBackup
          groupId={groupId}
          onSuccess={() => setSearchParams({ step: 'verifySuccess', groupId })}
        />
      ) : null}
      {params.get('step') === 'verifySuccess' ? (
        <VerifySuccess seedType={seedType} />
      ) : null}
    </>
  );
}

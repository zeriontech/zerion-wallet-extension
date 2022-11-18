import React, { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from 'react-query';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { SeedType } from 'src/shared/SeedType';
import { invariant } from 'src/shared/invariant';
import { Background } from 'src/ui/components/Background';
import { FillView } from 'src/ui/components/FillView';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageHeading } from 'src/ui/components/PageHeading';
import { PageTop } from 'src/ui/components/PageTop';
import { VerifyUser } from 'src/ui/components/VerifyUser';
import { walletPort } from 'src/ui/shared/channels';
import { prepareUserInputSeedOrPrivateKey } from 'src/ui/shared/prepareUserInputSeedOrPrivateKey';
import { useSecretValue } from 'src/ui/shared/requests/useWalletSecretQuery';
import { Button } from 'src/ui/ui-kit/Button';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { Surface } from 'src/ui/ui-kit/Surface';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import ArrowRightIcon from 'jsx:src/ui/assets/arrow-right.svg';
import InvisibleIcon from 'jsx:src/ui/assets/invisible.svg';
import { HStack } from 'src/ui/ui-kit/HStack';
import { PageBottom } from 'src/ui/components/PageBottom';
import { ViewLoading } from 'src/ui/components/ViewLoading';
import { useCopyToClipboard } from 'src/ui/shared/useCopyToClipboard';
import CopyIcon from 'jsx:src/ui/assets/copy.svg';
import { ZStack } from 'src/ui/ui-kit/ZStack';
import { SecretInput } from 'src/ui/components/SecretInput';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
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

type BackupKind = 'reveal' | 'verify';

function BlurredToggle({ children }: React.PropsWithChildren) {
  const [hidden, setHidden] = useState(true);
  const reveal = () => setHidden(false);
  return (
    <ZStack
      // click handler here is just for a larger click area;
      // semantically, click handler on the child button is enough
      onClick={reveal}
      style={{ cursor: hidden ? 'pointer' : undefined }}
    >
      <UnstyledButton
        type="button"
        aria-label="Visually reveal value"
        style={{ placeSelf: 'center', zIndex: 1 }}
        onClick={reveal}
      >
        {hidden ? (
          <InvisibleIcon style={{ display: 'block', width: 36, height: 36 }} />
        ) : null}
      </UnstyledButton>
      <div
        style={{
          filter: hidden ? 'blur(5px)' : undefined,
          transition: 'filter 250ms',
        }}
      >
        {children}
      </div>
    </ZStack>
  );
}

function RevealSecret({
  seedType,
  groupId,
  address,
  backupKind,
  onSubmit,
}: {
  seedType: SeedType;
  groupId: string;
  address: string | null;
  backupKind: BackupKind;
  onSubmit: ({ didCopy }: { didCopy: boolean }) => void;
}) {
  const { data: secretValue, isLoading } = useSecretValue({
    groupId,
    address,
    seedType,
  });
  const { handleCopy, isSuccess: isCopySuccess } = useCopyToClipboard({
    text: secretValue || '',
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
  if (!secretValue) {
    throw new Error('Could not get mnemonic');
  }
  const isMnemonic = seedType === SeedType.mnemonic;
  return (
    <PageColumn>
      <PageTop />

      <NavigationTitle title="Write this down" />
      <VStack gap={16}>
        <BlurredToggle>
          <Surface padding={16}>
            <UIText
              kind={isMnemonic ? 'body/accent' : 'body/regular'}
              style={{
                wordSpacing: 10,
                lineHeight: 1.6,
                textTransform: isMnemonic ? 'uppercase' : undefined,
                wordBreak: 'break-word',
              }}
            >
              {secretValue}
            </UIText>
          </Surface>
        </BlurredToggle>
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
        {backupKind === 'reveal' ? (
          'Done'
        ) : (
          <HStack gap={8} justifyContent="center">
            <span>Verify Backup</span>
            <ArrowRightIcon />
          </HStack>
        )}
      </Button>
      <PageBottom />
    </PageColumn>
  );
}

function VerifyBackup({
  groupId,
  address,
  seedType,
  onSuccess,
}: {
  groupId: string;
  address: string | null;
  seedType: SeedType;
  onSuccess: () => void;
}) {
  const verifyMutation = useMutation(
    async (value: string) => {
      if (seedType === SeedType.mnemonic) {
        const isCorrect = await walletPort.request('verifyRecoveryPhrase', {
          groupId,
          value,
        });
        if (!isCorrect) {
          throw new Error('Wrong phrase');
        }
        return true;
      } else if (seedType === SeedType.privateKey) {
        invariant(address, 'Address param is required for privateKey seedType');
        const isCorrect = await walletPort.request('verifyPrivateKey', {
          address,
          value,
        });
        if (!isCorrect) {
          throw new Error('Wrong phrase');
        }
        return true;
      }
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
  const autoFocusRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    autoFocusRef.current?.focus();
  }, []);
  return (
    <Background backgroundKind="white">
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
            <SecretInput
              ref={autoFocusRef}
              label={<UIText kind="subtitle/l_reg">Recovery Phrase</UIText>}
              name="seedOrPrivateKey"
              required={true}
              hint={
                verifyMutation.error ? (
                  <UIText kind="caption/reg" color="var(--negative-500)">
                    {(verifyMutation.error as Error).message || 'unknown error'}
                  </UIText>
                ) : null
              }
            />
          </VStack>
          <Button autoFocus={true} style={{ marginTop: 'auto' }}>
            Verify
          </Button>
          <PageBottom />
        </form>
      </PageColumn>
    </Background>
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
  const updateSearchParam = (
    key: string,
    value: string,
    navigateOptions?: Parameters<typeof setSearchParams>[1]
  ) => {
    const newParams = new URLSearchParams(params);
    newParams.set(key, value);
    setSearchParams(newParams, navigateOptions);
  };
  const navigate = useNavigate();
  const groupId = params.get('groupId');
  const backupKind = params.get('backupKind') as BackupKind | null;
  invariant(groupId, 'groupId param is required for BackupWallet view');
  invariant(backupKind, 'backupKind param is required for BackupWallet view');
  const { data: walletGroup, isLoading } = useQuery(
    `wallet/uiGetWalletGroup/${groupId}`,
    () => walletPort.request('uiGetWalletGroup', { groupId }),
    { useErrorBoundary: true }
  );
  const secretName =
    walletGroup?.walletContainer.seedType === SeedType.privateKey
      ? 'private key'
      : 'recovery phrase';
  const { handleCopy: emptyClipboard } = useCopyToClipboard({
    text: `You can copy and paste ${secretName} from where you saved it`,
  });
  if (isLoading || !walletGroup) {
    return null;
  }
  const { seedType: groupSeedType } = walletGroup.walletContainer;
  const address = params.get('address') || null;
  const seedType = address ? SeedType.privateKey : SeedType.mnemonic;
  if (groupSeedType === SeedType.privateKey && seedType === SeedType.mnemonic) {
    throw new Error(
      'Cannot display mnemonic for privateKey group. Address search-param is missing from BackupWallet view'
    );
  }

  /**
   * The logic for BackupWallet flow:
   * if backupKind === 'reveal', this means we only want
   * to show the user the secret and not ask to verify it.
   * In this case, the <Initial /> step is skipped and the last
   * steps (<VerifyBackup/>, <VerifySuccess />) are also skipped.
   *
   * For now, this is manageable, but if it gets more complicated,
   * these flows should be refactored into separate routes.
   */
  const isVerifyUserStep =
    params.get('step') === 'verifyUser' ||
    (params.has('step') == false && backupKind === 'reveal');
  return (
    <>
      {params.has('step') || backupKind === 'reveal' ? null : (
        <Initial onSubmit={() => updateSearchParam('step', 'verifyUser')} />
      )}
      {isVerifyUserStep ? (
        <PageColumn>
          <Background backgroundKind="white">
            <NavigationTitle title="Enter password" />
            <FillView adjustForNavigationBar={true}>
              <VerifyUser
                style={{ justifySelf: 'stretch' }}
                onSuccess={() =>
                  updateSearchParam('step', 'revealSecret', { replace: true })
                }
              />
            </FillView>
          </Background>
        </PageColumn>
      ) : null}
      {params.get('step') === 'revealSecret' ? (
        <RevealSecret
          groupId={groupId}
          address={address}
          seedType={seedType}
          backupKind={backupKind}
          onSubmit={({ didCopy }) => {
            if (didCopy && seedType === SeedType.mnemonic) {
              emptyClipboard();
            }
            if (backupKind === 'reveal') {
              navigate('/');
            } else {
              updateSearchParam('step', 'verifyBackup');
            }
          }}
        />
      ) : null}
      {params.get('step') === 'verifyBackup' ? (
        <VerifyBackup
          groupId={groupId}
          seedType={seedType}
          address={address}
          onSuccess={() => {
            updateSearchParam('step', 'verifySuccess');
          }}
        />
      ) : null}
      {params.get('step') === 'verifySuccess' ? (
        <VerifySuccess seedType={seedType} />
      ) : null}
    </>
  );
}

import React, { useEffect, useMemo, useReducer, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { SeedType } from 'src/shared/SeedType';
import { invariant } from 'src/shared/invariant';
import { Background } from 'src/ui/components/Background';
import { FillView } from 'src/ui/components/FillView';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { PageColumn } from 'src/ui/components/PageColumn';
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
import { UnstyledAnchor } from 'src/ui/ui-kit/UnstyledAnchor';
import ArrowRightIcon from 'jsx:src/ui/assets/arrow-right.svg';
import InvisibleIcon from 'jsx:src/ui/assets/invisible.svg';
import VisibleIcon from 'jsx:src/ui/assets/visible.svg';
import CheckIcon from 'jsx:src/ui/assets/check.svg';
import { HStack } from 'src/ui/ui-kit/HStack';
import { PageBottom } from 'src/ui/components/PageBottom';
import { ViewLoading } from 'src/ui/components/ViewLoading';
import { useCopyToClipboard } from 'src/ui/shared/useCopyToClipboard';
import CopyIcon from 'jsx:src/ui/assets/copy.svg';
import { ZStack } from 'src/ui/ui-kit/ZStack';
import { SecretInput } from 'src/ui/components/SecretInput';
import { useBodyStyle } from 'src/ui/components/Background/Background';
import { focusNode } from 'src/ui/shared/focusNode';
import { metaAppState } from 'src/ui/shared/meta-app-state';
import { zeroizeAfterSubmission } from 'src/ui/shared/zeroize-submission';
import {
  assertSignerContainer,
  isPrivateKeyContainer,
  isSignerContainer,
} from 'src/shared/types/validators';
import { WithConfetti } from '../GetStarted/components/DecorativeMessage/DecorativeMessage';
import { DecorativeMessage } from '../GetStarted/components/DecorativeMessage';
import { clipboardWarning } from './clipboardWarning';

function Initial({ onSubmit }: { onSubmit: () => void }) {
  useBodyStyle(
    useMemo(
      () => ({
        ['--background' as string]: 'transparent',
        backgroundColor: 'var(--primary-100)',
        backgroundImage:
          'radial-gradient(circle at top right, #2962ef3d,  transparent 374px)',
        backgroundRepeat: 'no-repeat',
      }),
      []
    )
  );
  return (
    <PageColumn>
      <NavigationTitle title={null} documentTitle="Backup Your Wallet" />
      <div
        style={{
          position: 'fixed',
          pointerEvents: 'none',
          zIndex: -1,
          width: '100%',
          height: '100vh',
          bottom: '-50vh',
          background:
            'conic-gradient(from 180deg at 50% 50%, #FF0000 0deg, rgba(255, 246, 39, 0.848958) 78.75deg, #53FF5A 136.88deg, #00FFFF 200.63deg, #0500FF 268.13deg, #700092 307.5deg, #FF0000 360deg)',
          opacity: 0.1,
          filter: 'blur(60px)',
        }}
      ></div>

      <Spacer height={48} />

      <VStack gap={16}>
        <VStack gap={8}>
          <DecorativeMessage
            text={
              <UIText kind="small/regular">
                Hi there! 👋 We're about to display your recovery phrase that
                will help secure your wallet and funds.
              </UIText>
            }
          />
          <DecorativeMessage
            isConsecutive={true}
            style={{ animationDelay: '1200ms' }}
            text={
              <UIText kind="small/regular">
                🔐 Backing up your wallet with a recovery phrase helps ensure
                you can access your assets even if you uninstall the extension
                or stop using Zerion
              </UIText>
            }
          />
          <DecorativeMessage
            isConsecutive={false}
            style={{ animationDelay: '2200ms' }}
            text={
              <UIText kind="small/regular">
                ☝️ Make sure you're ready to write down this recovery phrase and
                have a safe place to keep it. If you lose it, you'll never be
                able to access your funds again.
              </UIText>
            }
          />
          <DecorativeMessage
            isConsecutive={true}
            style={{ animationDelay: '3500ms' }}
            text={
              <UIText kind="small/accent">
                Reminder: Never share this recovery phrase with anyone.
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
  const [hidden, toggleHidden] = useReducer((x) => !x, true);
  const ref = useRef<HTMLButtonElement | null>(null);
  return (
    <ZStack>
      <Button
        kind="ghost"
        ref={ref}
        type="button"
        aria-label="Visually reveal value"
        size={32}
        style={{ placeSelf: 'end', zIndex: 1, marginRight: 4, marginBottom: 4 }}
        onClick={() => {
          toggleHidden();
        }}
      >
        {React.createElement(hidden ? InvisibleIcon : VisibleIcon, {
          style: {
            display: 'block',
            width: 24,
            height: 24,
            color: 'var(--primary)',
          },
        })}
      </Button>
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

      <UIText kind="body/regular">
        {isMnemonic ? (
          <span>
            Save these {secretValue.split(/\s+/).length} words to a password
            manager, or write them down and store them in a secure place
          </span>
        ) : (
          <span>
            Your private key can be used to access all of your funds. Do not
            share it with anyone
          </span>
        )}
      </UIText>
      <Spacer height={24} />
      <VStack gap={16}>
        <BlurredToggle>
          <Surface
            padding={16}
            style={{
              paddingRight: 36, // because of toggle button on the right
            }}
          >
            <UIText
              kind={isMnemonic ? 'body/accent' : 'body/regular'}
              style={{
                textTransform: isMnemonic ? 'capitalize' : undefined,
                wordBreak: 'break-word',
              }}
            >
              {secretValue}
            </UIText>
          </Surface>
        </BlurredToggle>
        <div style={{ textAlign: 'center' }}>
          <Button
            kind="regular"
            size={36}
            type="button"
            onClick={copyRecoveryPhrase}
            style={{ paddingLeft: 16, paddingRight: 16 }}
          >
            <HStack gap={8}>
              {React.createElement(isCopySuccess ? CheckIcon : CopyIcon, {
                style: { display: 'block', width: 20, height: 20 },
              })}
              <ZStack
                hideLowerElements={true}
                justifyContent="start"
                style={{ textAlign: 'left' }}
              >
                {isCopySuccess ? <span>Copied to Clipboard</span> : null}
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
          <HStack gap={8} alignItems="center" justifyContent="center">
            <span>Verify Backup</span>
            <ArrowRightIcon style={{ position: 'relative', bottom: -1 }} />
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
  const verifyMutation = useMutation({
    mutationFn: async (value: string) => {
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
          throw new Error('Wrong private key');
        }
        return true;
      }
    },
    onSuccess: async () => {
      if (!groupId) {
        throw new Error('No groupId');
      }
      await walletPort.request('updateLastBackedUp', { groupId });
      zeroizeAfterSubmission();
      onSuccess();
    },
  });
  const autoFocusRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    autoFocusRef.current?.focus();
  }, []);
  return (
    <Background backgroundKind="white">
      <PageColumn>
        <PageTop />
        <UIText kind="body/regular">
          This process is aimed to ensure you’ve saved your recovery phrase
          correctly
        </UIText>
        <Spacer height={24} />
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
          <VStack gap={12}>
            <SecretInput
              showRevealElement={false}
              ref={autoFocusRef}
              label={
                <UIText kind="small/accent">
                  Validate Your Recovery Phrase
                </UIText>
              }
              name="seedOrPrivateKey"
              required={true}
              hint={
                verifyMutation.error ? (
                  <UIText kind="caption/regular" color="var(--negative-500)">
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
        originY={0.5}
        leftOriginX={0.25}
        rightOriginX={0.75}
        gravity={0.2}
        decay={0.84}
        particleCount={50}
        startVelocity={20}
        style={{ zIndex: 0 }}
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
              Be sure to store your{' '}
              {seedType === SeedType.privateKey
                ? 'private key'
                : 'recovery phrase'}{' '}
              in a secure location and remember:
              <br />
              <UIText kind="body/accent" inline={true}>
                {metaAppState.getState().hasTestWallet ? (
                  <UnstyledAnchor
                    href="https://www.youtube.com/watch?v=HKD_BxFcnN4"
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Easter egg for holders of zerion testing wallet 😘"
                  >
                    RESPECT IS EVERYTHING
                  </UnstyledAnchor>
                ) : (
                  'Never share it with anyone'
                )}
              </UIText>
            </UIText>
          </VStack>
        </FillView>
        <Button
          ref={focusNode}
          style={{ marginTop: 'auto' }}
          as={Link}
          to="/overview"
        >
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
  const { data: walletGroup, isLoading } = useQuery({
    queryKey: [`wallet/uiGetWalletGroup/${groupId}`],
    queryFn: () => walletPort.request('uiGetWalletGroup', { groupId }),
    useErrorBoundary: true,
  });
  const { handleCopy: emptyClipboard } = useCopyToClipboard({
    // We replace user clipboard with a warning message.
    // This works as "emptying" the clipboard, but it's more helpful
    // than just putting empty string there, in my opinion.
    // Also, if we see the user pasting this message, we can show a more
    // detailed message about what's going on.
    text: clipboardWarning.getMessage(
      walletGroup && isSignerContainer(walletGroup.walletContainer)
        ? walletGroup.walletContainer.seedType
        : SeedType.mnemonic
    ),
  });
  if (isLoading || !walletGroup) {
    return null;
  }
  assertSignerContainer(walletGroup.walletContainer);
  const isPrivateKeyGroup = isPrivateKeyContainer(walletGroup.walletContainer);
  const address = params.get('address') || null;

  // NOTE: we assume that if the address param is provided, then we want
  // to display the Private Key, if not, then the Mnemonic
  // I think this should be changed to a more explicit parameter
  const seedType = address ? SeedType.privateKey : SeedType.mnemonic;
  if (isPrivateKeyGroup && !address) {
    // TODO: technically address shouldn't be required
    throw new Error('Address search-param is required for private key flow');
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
            <NavigationTitle title="Backup Wallet" />
            <PageTop />
            <VerifyUser
              text={`Verification is required to show your ${
                seedType === SeedType.mnemonic
                  ? 'recovery phrase'
                  : 'secret key'
              }`}
              onSuccess={() =>
                updateSearchParam('step', 'revealSecret', { replace: true })
              }
            />
            <PageBottom />
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

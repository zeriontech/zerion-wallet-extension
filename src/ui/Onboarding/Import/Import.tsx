import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import ArrowLeftIcon from 'jsx:src/ui/assets/arrow-left.svg';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { HStack } from 'src/ui/ui-kit/HStack';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { TextAnchor } from 'src/ui/ui-kit/TextAnchor';
import type { BareWallet } from 'src/shared/types/BareWallet';
import { setCurrentAddress } from 'src/ui/shared/requests/setCurrentAddress';
import { accountPublicRPCPort, walletPort } from 'src/ui/shared/channels';
import { HandshakeFailure } from 'src/ui/components/HandshakeFailure';
import { rejectAfterDelay } from 'src/shared/rejectAfterDelay';
import { zeroizeAfterSubmission } from 'src/ui/shared/zeroize-submission';
import { useErrorBoundary } from 'src/ui/shared/useErrorBoundary';
import lockIconSrc from '../assets/lock.png';
import { useSizeStore } from '../useSizeStore';
import { Stack } from '../Stack';
import * as styles from './styles.module.css';
import { FAQ } from './FAQ';
import { ImportKey } from './ImportKey';
import { Password } from './Password';
import { ImportMnemonic } from './ImportMnemonic';
import {
  PasswordStep,
  ViewParam,
  assertPasswordStep,
  assertViewParam,
} from './ImportSearchParams';

function Step({ active }: { active: boolean }) {
  return (
    <div
      className={styles.step}
      style={{
        backgroundColor: active ? 'var(--primary)' : 'var(--neutral-300)',
      }}
    />
  );
}

export function Import() {
  const { isNarrowView } = useSizeStore();
  const navigate = useNavigate();
  const [showError, setShowError] = useState(false);
  const { walletAddress, type } = useParams<{
    walletAddress: string;
    type: 'private-key' | 'mnemonic';
  }>();
  const [params, setSearchParams] = useSearchParams();
  const view = params.get('view') || 'secret';
  const step = params.get('step') || 'create';
  assertViewParam(view);
  assertPasswordStep(step);
  const isConfirmStep = step === PasswordStep.confirm;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleBackClick = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const [wallet, setWallet] = useState<BareWallet | null>(null);
  const handleWallet = useCallback(
    (wallet: BareWallet) => {
      setWallet(wallet);
      setSearchParams(`view=${ViewParam.password}`);
    },
    [setSearchParams]
  );

  const { mutate: createUserAndWallet, isLoading } = useMutation({
    mutationFn: async ({
      password,
      wallet,
    }: {
      password: string;
      wallet: BareWallet;
    }) => {
      setShowError(false);
      return Promise.race([
        (async () => {
          await new Promise((r) => setTimeout(r, 1000));
          await accountPublicRPCPort.request('createUser', {
            password,
          });
          if (type === 'mnemonic' && wallet.mnemonic) {
            await walletPort.request('uiImportSeedPhrase', [wallet.mnemonic]);
          }
          await accountPublicRPCPort.request('saveUserAndWallet');
          await setCurrentAddress({ address: wallet.address });
        })(),
        rejectAfterDelay(3000),
      ]);
    },
    onSuccess: () => {
      zeroizeAfterSubmission();
      navigate('/onboarding/success');
    },
    onError: () => {
      setShowError(true);
    },
  });

  const showErrorBoundary = useErrorBoundary();

  const handlePasswordSubmit = useCallback(
    (password: string) => {
      if (!wallet) {
        showErrorBoundary(new Error('No wallet created'));
        return;
      }
      createUserAndWallet({ password, wallet });
    },
    [wallet, createUserAndWallet, showErrorBoundary]
  );

  if (view === ViewParam.password && !wallet) {
    setSearchParams(`view=${ViewParam.secret}`, { replace: true });
    return null;
  }

  return (
    <VStack gap={isNarrowView ? 16 : 56}>
      <div className={styles.container}>
        {isLoading ? (
          <div className={styles.loadingOverlay}>
            <UIText kind="headline/hero" className={styles.loadingTitle}>
              Importing wallet
            </UIText>
          </div>
        ) : null}
        <UnstyledButton
          onClick={handleBackClick}
          aria-label="Go Back"
          className={styles.backButton}
        >
          <ArrowLeftIcon style={{ width: 20, height: 20 }} />
        </UnstyledButton>
        <HStack gap={4} className={styles.steps} justifyContent="center">
          <Step active={view === ViewParam.secret} />
          <Step active={view === ViewParam.password && !isConfirmStep} />
          <Step active={view === ViewParam.password && isConfirmStep} />
        </HStack>
        {walletAddress && type ? (
          <Stack
            gap={isNarrowView ? 0 : 60}
            direction={isNarrowView ? 'vertical' : 'horizontal'}
            style={{
              gridTemplateColumns:
                isNarrowView || showError ? undefined : '380px auto',
              justifyContent: 'center',
            }}
          >
            {showError ? (
              <HandshakeFailure />
            ) : view === 'password' ? (
              <Password step={step} onSubmit={handlePasswordSubmit} />
            ) : view === 'secret' ? (
              type === 'private-key' ? (
                <ImportKey
                  address={walletAddress}
                  onWalletCreate={handleWallet}
                />
              ) : type === 'mnemonic' ? (
                <ImportMnemonic
                  address={walletAddress}
                  onWalletCreate={handleWallet}
                />
              ) : null
            ) : null}
            {isNarrowView || showError ? null : (
              <FAQ type={view === ViewParam.password ? 'password' : type} />
            )}
          </Stack>
        ) : null}
      </div>
      {isNarrowView && type ? (
        <div className={styles.faqContainer}>
          <FAQ type={view === ViewParam.password ? 'password' : type} />
        </div>
      ) : null}
      <HStack gap={16} justifyContent="center" alignItems="center">
        <img src={lockIconSrc} style={{ width: 20, height: 20 }} />
        <UIText kind="small/accent" color="var(--neutral-600)" inline={true}>
          We never store your keys, collect your full IP address, sell or share
          your data. See here for our{' '}
          <TextAnchor
            href="https://s3.amazonaws.com/cdn.zerion.io/assets/privacy.pdf"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-block' }}
          >
            <UIText kind="small/accent" color="var(--primary)">
              full policy.
            </UIText>
          </TextAnchor>
        </UIText>
      </HStack>
    </VStack>
  );
}

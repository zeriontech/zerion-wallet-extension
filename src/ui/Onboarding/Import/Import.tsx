import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation } from 'react-query';
import ArrowLeftIcon from 'jsx:src/ui/assets/arrow-left.svg';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { HStack } from 'src/ui/ui-kit/HStack';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { TextAnchor } from 'src/ui/ui-kit/TextAnchor';
import { BareWallet } from 'src/shared/types/BareWallet';
import { setCurrentAddress } from 'src/ui/shared/requests/setCurrentAddress';
import { accountPublicRPCPort, walletPort } from 'src/ui/shared/channels';
import { KeyboardShortcut } from 'src/ui/components/KeyboardShortcut';
import LockIcon from '../assets/lock.png';
import { useSizeStore } from '../useSizeStore';
import { Stack } from '../Stack';
import * as styles from './styles.module.css';
import { FAQ } from './FAQ';
import { ImportKey } from './ImportKey';
import { Password } from './Password';
import { ImportMnemonic } from './ImportMnemonic';

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
  const [step, setStep] = useState<'secret' | 'password'>('secret');
  const { walletAddress, type } = useParams<{
    walletAddress: string;
    type: 'private-key' | 'mnemonic';
  }>();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleBackClick = useCallback(() => {
    if (step === 'secret') {
      navigate(`/onboarding/welcome/${walletAddress}`);
    } else if (step === 'password') {
      setStep('secret');
    }
  }, [navigate, step, walletAddress]);

  const [wallet, setWallet] = useState<BareWallet | null>(null);
  const handleWallet = useCallback((wallet: BareWallet) => {
    setWallet(wallet);
    setStep('password');
  }, []);

  const { mutate, isLoading } = useMutation(
    async ({ password, wallet }: { password: string; wallet: BareWallet }) => {
      await new Promise((r) => setTimeout(r, 1000));
      await accountPublicRPCPort.request('createUser', {
        password,
      });
      if (type === 'mnemonic' && wallet.mnemonic) {
        await walletPort.request('uiImportSeedPhrase', [wallet.mnemonic]);
      }
      await accountPublicRPCPort.request('saveUserAndWallet');
      await setCurrentAddress({ address: wallet.address });
    },
    {
      onSuccess: () => {
        navigate('/onboarding/success');
      },
    }
  );

  const handlePasswordSubmit = useCallback(
    (password: string) => {
      if (!wallet) {
        return;
      }
      mutate({ password, wallet });
    },
    [wallet, mutate]
  );

  return (
    <VStack gap={isNarrowView ? 16 : 56}>
      <KeyboardShortcut combination="esc" onKeyDown={handleBackClick} />
      <div className={styles.container}>
        {isLoading ? (
          <div className={styles.loadingOverlay}>
            <UIText kind="headline/hero" className={styles.loadingTitle}>
              Creating wallet
            </UIText>
          </div>
        ) : null}
        <UnstyledButton onClick={handleBackClick}>
          <div className={styles.backButton}>
            <ArrowLeftIcon style={{ width: 20, height: 20 }} />
          </div>
        </UnstyledButton>
        <HStack gap={4} className={styles.steps} justifyContent="center">
          <Step active={step === 'secret'} />
          <Step active={step === 'password'} />
        </HStack>
        {walletAddress && type ? (
          <Stack
            gap={isNarrowView ? 0 : 60}
            direction={isNarrowView ? 'vertical' : 'horizontal'}
            style={{
              gridTemplateColumns: isNarrowView ? undefined : '380px auto',
            }}
          >
            {step === 'password' ? (
              <Password onSubmit={handlePasswordSubmit} />
            ) : type === 'private-key' ? (
              <ImportKey
                address={walletAddress}
                onWalletCreate={handleWallet}
              />
            ) : type === 'mnemonic' ? (
              <ImportMnemonic
                address={walletAddress}
                onWalletCreate={handleWallet}
              />
            ) : null}
            {isNarrowView ? null : (
              <FAQ type={step === 'password' ? 'password' : type} />
            )}
          </Stack>
        ) : null}
      </div>
      {isNarrowView && type ? (
        <div className={styles.faqContainer}>
          <FAQ type={step === 'password' ? 'password' : type} />
        </div>
      ) : null}
      <HStack gap={16} justifyContent="center" alignItems="center">
        <img src={LockIcon} style={{ width: 20, height: 20 }} />
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

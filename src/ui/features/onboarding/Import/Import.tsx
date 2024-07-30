import React, { useCallback, useEffect, useState } from 'react';
import {
  Navigate,
  Route,
  Routes,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { animated } from '@react-spring/web';
import { isTruthy } from 'is-truthy-ts';
import { RenderArea } from 'react-area';
import ArrowLeftIcon from 'jsx:src/ui/assets/arrow-left.svg';
import ArrowRightIcon from 'jsx:src/ui/assets/arrow-right.svg';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { HStack } from 'src/ui/ui-kit/HStack';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import type { BareWallet } from 'src/shared/types/BareWallet';
import type { ExternallyOwnedAccount } from 'src/shared/types/ExternallyOwnedAccount';
import { setCurrentAddress } from 'src/ui/shared/requests/setCurrentAddress';
import { accountPublicRPCPort, walletPort } from 'src/ui/shared/channels';
import { HandshakeFailure } from 'src/ui/components/HandshakeFailure';
import { rejectAfterDelay } from 'src/shared/rejectAfterDelay';
import { zeroizeAfterSubmission } from 'src/ui/shared/zeroize-submission';
import { useErrorBoundary } from 'src/ui/shared/useErrorBoundary';
import { PrivacyFooter } from 'src/ui/components/PrivacyFooter';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import { useTransformTrigger } from 'src/ui/components/useTransformTrigger';
import { isSessionExpiredError } from 'src/ui/shared/isSessionExpiredError';
import { useWindowSizeStore } from 'src/ui/shared/useWindowSizeStore';
import { Stack } from 'src/ui/ui-kit/Stack';
import { useGoBack } from 'src/ui/shared/navigation/useGoBack';
import keyIconSrc from '../assets/key.png';
import dialogIconSrc from '../assets/dialog.png';
import { Password } from '../Password';
import { assertPasswordStep } from '../Password/passwordSearchParams';
import * as helperStyles from '../shared/helperStyles.module.css';
import { useOnboardingSession } from '../shared/useOnboardingSession';
import * as styles from './styles.module.css';
import { ImportKey } from './ImportKey';
import { ImportMnemonic } from './ImportMnemonic';
import { ViewParam, assertViewParam } from './ImportSearchParams';
import { SelectWallets } from './SelectWallets';
import { SecurityInfo } from './SecurityInfo';

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

function ImportWallet() {
  const { isNarrowView } = useWindowSizeStore();
  const navigate = useNavigate();
  const [showError, setShowError] = useState(false);
  const { type } = useParams<{ type: 'private-key' | 'mnemonic' }>();
  const [params, setSearchParams] = useSearchParams();
  const view = params.get('view') || 'secret';
  const step = params.get('step') || 'create';
  assertViewParam(view);
  assertPasswordStep(step);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const goBack = useGoBack();

  const [wallets, setWallets] = useState<BareWallet[] | null>(null);
  const [mnemonic, setMnemonic] = useState<string | null>(null);
  const handleWallets = useCallback(
    (wallets: BareWallet[]) => {
      setWallets(wallets);
      setSearchParams(`view=${ViewParam.password}`);
    },
    [setSearchParams]
  );

  const { mutate: createUserAndWallet, isLoading } = useMutation({
    mutationFn: async ({
      password,
      wallets,
    }: {
      password: string | null;
      wallets: BareWallet[];
    }) => {
      setShowError(false);
      return Promise.race([
        (async () => {
          await new Promise((r) => setTimeout(r, 1000));
          if (!wallets.length) {
            throw new Error('No wallets found');
          }
          if (password) {
            await accountPublicRPCPort.request('createUser', {
              password,
            });
          }
          let data: BareWallet | ExternallyOwnedAccount | null = null;
          if (type === 'mnemonic') {
            data = await walletPort.request(
              'uiImportSeedPhrase',
              wallets.map((wallet) => wallet.mnemonic).filter(isTruthy)
            );
          }
          await accountPublicRPCPort.request('saveUserAndWallet');
          await setCurrentAddress({
            address: data?.address || wallets[0].address,
          });
        })(),
        rejectAfterDelay(10000, 'Onboarding Import: createUser'),
      ]);
    },
    onSuccess: () => {
      zeroizeAfterSubmission();
      navigate('/onboarding/success');
    },
    onError: (error) => {
      if (isSessionExpiredError(error)) {
        navigate('/onboarding/session-expired', { replace: true });
      }
      setShowError(true);
    },
    useErrorBoundary: true,
  });

  const showErrorBoundary = useErrorBoundary();

  const handlePasswordSubmit = useCallback(
    (password: string | null) => {
      if (!wallets?.length) {
        showErrorBoundary(new Error('No wallets created'));
        return;
      }
      createUserAndWallet({ password, wallets });
    },
    [wallets, createUserAndWallet, showErrorBoundary]
  );

  const { sessionDataIsLoading } = useOnboardingSession({
    navigateOnExistingUser: 'session-expired',
  });

  if (sessionDataIsLoading) {
    return null;
  }

  if (view === ViewParam.password && !wallets?.length) {
    return (
      <Navigate to={{ search: `view=${ViewParam.secret}` }} replace={true} />
    );
  }

  if (view === ViewParam['select-wallets'] && !mnemonic) {
    return (
      <Navigate to={{ search: `view=${ViewParam.secret}` }} replace={true} />
    );
  }

  return (
    <VStack gap={isNarrowView ? 16 : 56}>
      <div className={helperStyles.container} style={{ minHeight: 430 }}>
        {isLoading ? (
          <div className={helperStyles.loadingOverlay}>
            <UIText kind="headline/hero" className={helperStyles.loadingTitle}>
              Importing Wallet
            </UIText>
          </div>
        ) : null}
        <UnstyledButton
          onClick={goBack}
          aria-label="Go Back"
          className={helperStyles.backButton}
        >
          <ArrowLeftIcon style={{ width: 20, height: 20 }} />
        </UnstyledButton>
        <HStack gap={4} className={styles.steps} justifyContent="center">
          <Step
            active={
              view === ViewParam.secret || view === ViewParam['select-wallets']
            }
          />
          <Step active={view === ViewParam.password} />
        </HStack>
        {type ? (
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
              <Password
                title="Finally, create your password"
                step={step}
                onSubmit={handlePasswordSubmit}
              />
            ) : view === 'secret' ? (
              type === 'private-key' ? (
                <ImportKey
                  onWalletCreate={(wallet) =>
                    handleWallets([wallet as BareWallet])
                  }
                />
              ) : type === 'mnemonic' ? (
                <ImportMnemonic
                  onSubmit={(phrase) => {
                    setMnemonic(phrase);
                    setSearchParams(`view=${ViewParam['select-wallets']}`);
                  }}
                />
              ) : null
            ) : view === 'select-wallets' ? (
              <SelectWallets mnemonic={mnemonic} onSelect={handleWallets} />
            ) : null}
            {isNarrowView || showError ? null : (
              <RenderArea name="onboarding-faq" />
            )}
          </Stack>
        ) : null}
      </div>
      {isNarrowView && !showError ? (
        <div className={helperStyles.faqContainer}>
          <RenderArea name="onboarding-faq" />
        </div>
      ) : null}
      <PrivacyFooter />
    </VStack>
  );
}

function TypeLink({
  title,
  to,
  icon,
}: {
  title: string;
  to: string;
  icon: React.ReactNode;
}) {
  const { style: iconStyle, trigger: hoverTrigger } = useTransformTrigger({
    x: 2,
  });

  return (
    <UnstyledLink
      to={to}
      className={styles.link}
      onMouseEnter={hoverTrigger}
      onFocus={hoverTrigger}
    >
      <VStack
        gap={16}
        style={{
          position: 'relative',
          borderRadius: 20,
          padding: 24,
          backgroundColor: 'var(--neutral-100)',
        }}
      >
        <div className={styles.typeLinkIcon}>{icon}</div>
        <UIText kind="headline/h3">
          Import
          <br />
          {title}
        </UIText>
        <div className={styles.linkArrow}>
          <animated.div style={{ ...iconStyle, display: 'flex' }}>
            <ArrowRightIcon />
          </animated.div>
        </div>
      </VStack>
    </UnstyledLink>
  );
}

function TypeSelector() {
  const { isNarrowView } = useWindowSizeStore();
  const goBack = useGoBack();

  return (
    <VStack gap={isNarrowView ? 16 : 56}>
      <div
        className={helperStyles.container}
        style={{ paddingBottom: 0, paddingInline: 0, overflow: 'hidden' }}
      >
        <div style={{ paddingBottom: 80, paddingInline: 88 }}>
          <UnstyledButton
            onClick={goBack}
            aria-label="Go Back"
            className={helperStyles.backButton}
          >
            <ArrowLeftIcon style={{ width: 20, height: 20 }} />
          </UnstyledButton>
          <VStack gap={60}>
            <VStack gap={8}>
              <UIText kind="headline/h2">Import wallet</UIText>
              <UIText kind="body/regular">
                Select a method to import your existing wallet.
              </UIText>
            </VStack>
            <Stack
              direction={isNarrowView ? 'vertical' : 'horizontal'}
              gap={16}
              style={{ gridTemplateColumns: isNarrowView ? '1fr' : '1fr 1fr' }}
            >
              <TypeLink
                title="Recovery Phrase"
                to="./mnemonic"
                icon={<img src={dialogIconSrc} />}
              />
              <TypeLink
                title="Private Key"
                to="./private-key"
                icon={<img src={keyIconSrc} />}
              />
            </Stack>
          </VStack>
        </div>
        <SecurityInfo />
      </div>
      <PrivacyFooter />
    </VStack>
  );
}

export function Import() {
  return (
    <Routes>
      <Route path="/" element={<TypeSelector />} />
      <Route path="/:type" element={<ImportWallet />} />
    </Routes>
  );
}

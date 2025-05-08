import { useMutation } from '@tanstack/react-query';
import ArrowLeftIcon from 'jsx:src/ui/assets/arrow-left.svg';
import noop from 'lodash/noop';
import React, { useCallback, useState } from 'react';
import { RenderArea } from 'react-area';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { invariant } from 'src/shared/invariant';
import { wait } from 'src/shared/wait';
import type { BlockchainType } from 'src/shared/wallet/classifiers';
import { PrivacyFooter } from 'src/ui/components/PrivacyFooter';
import { useToggledValues } from 'src/ui/components/useToggledValues';
import { EcosystemOptionsList } from 'src/ui/pages/GetStarted/GetStarted';
import { accountPublicRPCPort, walletPort } from 'src/ui/shared/channels';
import { isSessionExpiredError } from 'src/ui/shared/isSessionExpiredError';
import { useGoBack } from 'src/ui/shared/navigation/useGoBack';
import { useWindowSizeStore } from 'src/ui/shared/useWindowSizeStore';
import { zeroizeAfterSubmission } from 'src/ui/shared/zeroize-submission';
import { Button } from 'src/ui/ui-kit/Button';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { Stack } from 'src/ui/ui-kit/Stack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { VStack } from 'src/ui/ui-kit/VStack';
import { FEATURE_SOLANA } from 'src/env/config';
import { Password } from '../Password';
import { assertPasswordStep } from '../Password/passwordSearchParams';
import * as helperStyles from '../shared/helperStyles.module.css';
import { useOnboardingSession } from '../shared/useOnboardingSession';

const ViewParam = {
  password: 'password',
  'select-wallets': 'select-wallets',
} as const;

type ViewParam = (typeof ViewParam)[keyof typeof ViewParam];

function assertViewParam(value: string): asserts value is ViewParam {
  if (value in ViewParam === false) {
    throw new Error('Unsupported view parameter');
  }
}

export function CreateUser() {
  const { isNarrowView } = useWindowSizeStore();
  const [showError, setShowError] = useState(false);
  const [params, setSearchParams] = useSearchParams();
  const view = params.get('view') || 'password';
  const step = params.get('step') || 'create';
  assertViewParam(view);
  assertPasswordStep(step);

  const navigate = useNavigate();
  const goBack = useGoBack();

  const [password, setPassword] = useState<string | null>(null);
  const handlePasswordSubmit = useCallback((value: string) => {
    setPassword(value);
  }, []);

  const [values, toggleValueOriginal] = useToggledValues(
    () =>
      new Set<BlockchainType>(
        FEATURE_SOLANA === 'on' ? ['evm', 'solana'] : ['evm']
      )
  );
  const toggleValue = FEATURE_SOLANA === 'on' ? toggleValueOriginal : noop;

  const { mutate: handleSubmit, isLoading } = useMutation({
    mutationFn: async () => {
      await wait(2000);
      invariant(password && password !== '', 'Password not set');
      await accountPublicRPCPort.request('createUser', { password });
      await walletPort.request('uiGenerateMnemonic', {
        ecosystems: Array.from(values),
      });
    },
    onSuccess: () => {
      zeroizeAfterSubmission();
      navigate('/onboarding/backup');
    },
    onError: (e) => {
      if (isSessionExpiredError(e)) {
        navigate('/onboarding/session-expired', { replace: true });
      }
      setShowError(true);
    },
  });

  const { sessionDataIsLoading } = useOnboardingSession({
    navigateOnExistingUser: 'session-expired',
  });

  if (sessionDataIsLoading) {
    return null;
  }

  return (
    <VStack gap={isNarrowView ? 16 : 56}>
      <div
        className={helperStyles.container}
        style={
          view === 'select-wallets'
            ? {
                gridTemplateColumns: 'minmax(min-content, 380px)',
                justifyContent: 'center',
              }
            : undefined
        }
      >
        {isLoading ? (
          <div className={helperStyles.loadingOverlay}>
            <UIText kind="headline/hero" className={helperStyles.loadingTitle}>
              Creating Wallet
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
        {view === 'password' ? (
          <Stack
            gap={isNarrowView ? 0 : 60}
            direction={isNarrowView ? 'vertical' : 'horizontal'}
            style={{
              gridTemplateColumns:
                isNarrowView || showError ? undefined : '380px auto',
              justifyContent: 'center',
            }}
          >
            <Password
              title="Create Your Password"
              step={step}
              defaultValue={password}
              onSubmit={(password) => {
                handlePasswordSubmit(password);
                setSearchParams(`view=${ViewParam['select-wallets']}`);
              }}
            />
            {isNarrowView || showError ? null : (
              <RenderArea name="onboarding-faq" />
            )}
          </Stack>
        ) : view === 'select-wallets' ? (
          <div>
            <VStack gap={8}>
              <UIText kind="headline/h2">Create New Wallet</UIText>
              <UIText kind="body/regular">
                You can update this selection later in Settings
              </UIText>
            </VStack>
            <Spacer height={24} />
            <div style={{ marginInline: -16 }}>
              <EcosystemOptionsList
                values={values}
                onValueToggle={toggleValue}
              />
            </div>
            <Spacer height={32} />
            <Button
              style={{ width: '100%' }}
              onClick={() => {
                handleSubmit();
              }}
            >
              Create
            </Button>
          </div>
        ) : null}
      </div>
      {view === 'password' && isNarrowView && !showError ? (
        <div className={helperStyles.faqContainer}>
          <RenderArea name="onboarding-faq" />
        </div>
      ) : null}
      <PrivacyFooter />
    </VStack>
  );
}

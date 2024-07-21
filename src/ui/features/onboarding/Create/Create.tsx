import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { RenderArea } from 'react-area';
import ArrowLeftIcon from 'jsx:src/ui/assets/arrow-left.svg';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { PrivacyFooter } from 'src/ui/components/PrivacyFooter';
import { wait } from 'src/shared/wait';
import { accountPublicRPCPort, walletPort } from 'src/ui/shared/channels';
import { zeroizeAfterSubmission } from 'src/ui/shared/zeroize-submission';
import { useWindowSizeStore } from 'src/ui/shared/useWindowSizeStore';
import { isSessionExpiredError } from 'src/ui/shared/isSessionExpiredError';
import { Stack } from 'src/ui/ui-kit/Stack';
import { useGoBack } from 'src/ui/shared/navigation/useGoBack';
import { Password } from '../Password';
import { assertPasswordStep } from '../Password/passwordSearchParams';
import * as helperStyles from '../shared/helperStyles.module.css';
import { useOnboardingSession } from '../shared/useOnboardingSession';

export function Create() {
  const { isNarrowView } = useWindowSizeStore();
  const [params] = useSearchParams();
  const [showError, setShowError] = useState(false);
  const step = params.get('step') || 'create';
  assertPasswordStep(step);

  const navigate = useNavigate();
  const goBack = useGoBack();

  const { mutate: handleSubmit, isLoading } = useMutation({
    mutationFn: async ({ password }: { password: string | null }) => {
      await wait(2000);
      if (password) {
        await accountPublicRPCPort.request('createUser', { password });
      }
      await walletPort.request('uiGenerateMnemonic');
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
      <div className={helperStyles.container}>
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
            onSubmit={(password) => handleSubmit({ password })}
          />
          {isNarrowView || showError ? null : (
            <RenderArea name="onboarding-faq" />
          )}
        </Stack>
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

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
import { useSizeStore } from '../useSizeStore';
import { Password } from '../Password';
import { Stack } from '../Stack';
import { assertPasswordStep } from '../Password/passwordSearchParams';
import * as helperStyles from '../shared/helperStyles.module.css';
import { isSessionExpiredError } from '../shared/isSessionExpiredError';

export function CreatePassword({
  onCreate,
  onExit,
}: {
  onCreate(): void;
  onExit(): void;
}) {
  const { isNarrowView } = useSizeStore();
  const [params] = useSearchParams();
  const [showError, setShowError] = useState(false);
  const step = params.get('step') || 'create';
  const navigate = useNavigate();
  assertPasswordStep(step);

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
      onCreate();
    },
    onError: (e) => {
      if (isSessionExpiredError(e)) {
        navigate('/onboarding/session-expired', { replace: true });
      }
      setShowError(true);
    },
  });

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
          onClick={onExit}
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

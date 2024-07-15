import React, { useId } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { PublicUser } from 'src/shared/types/User';
import ArrowLeftIcon from 'jsx:src/ui/assets/arrow-left.svg';
import { accountPublicRPCPort } from 'src/ui/shared/channels';
import { zeroizeAfterSubmission } from 'src/ui/shared/zeroize-submission';
import { Button } from 'src/ui/ui-kit/Button';
import { Input } from 'src/ui/ui-kit/Input';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { useWindowSizeStore } from 'src/ui/shared/useWindowSizeStore';
import { PrivacyFooter } from 'src/ui/components/PrivacyFooter';
import { Stack } from 'src/ui/ui-kit/Stack';
import * as helperStyles from 'src/ui/features/onboarding/shared/helperStyles.module.css';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { useGoBack } from 'src/ui/shared/navigation/useGoBack';
import * as styles from './styles.module.css';

export function VerifyUser({ onSuccess }: { onSuccess: () => void }) {
  const { isNarrowView } = useWindowSizeStore();

  const goBack = useGoBack();

  const { data: user, isLoading } = useQuery({
    queryKey: ['account/getExistingUser'],
    queryFn: () => {
      return accountPublicRPCPort.request('getExistingUser');
    },
    useErrorBoundary: true,
  });
  const loginMutation = useMutation({
    mutationFn: ({
      user,
      password,
    }: {
      user: PublicUser;
      password: string;
    }) => {
      return accountPublicRPCPort.request('login', { user, password });
    },
    onSuccess() {
      zeroizeAfterSubmission();
      onSuccess();
    },
  });

  const inputId = useId();

  if (isLoading) {
    return null;
  }

  const faq = (
    <VStack gap={24} style={{ alignContent: 'start' }}>
      {isNarrowView ? null : (
        <div className={styles.faqIcon}>
          <div style={{ width: 20, height: 20 }}>☝️</div>
        </div>
      )}
      <VStack gap={8}>
        <UIText kind="small/regular" color="var(--neutral-600)">
          For security, it's crucial to write down the recovery phrase and store
          it securely.
        </UIText>
        <UIText kind="small/regular" color="var(--neutral-600)">
          Your recovery phrase is the only way to access your accounts and
          assets, even if you forget your passcode.
        </UIText>
        <UIText kind="small/regular" color="var(--neutral-600)">
          Never share your recovery phrase or passcode with anyone, including
          Zerion team members.
        </UIText>
      </VStack>
    </VStack>
  );

  return (
    <VStack gap={isNarrowView ? 16 : 56}>
      <div className={helperStyles.container}>
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
            gridTemplateColumns: isNarrowView ? undefined : '380px auto',
            justifyContent: 'center',
          }}
        >
          <VStack gap={24} style={{ alignItems: 'start' }}>
            <VStack gap={8}>
              <UIText kind="headline/h2">Enter Password</UIText>
              <UIText kind="body/regular">
                This password is required to reveal your recovery phrase.
              </UIText>
            </VStack>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                const password = new FormData(event.currentTarget).get(
                  'password'
                ) as string | undefined;
                if (!password) {
                  return;
                }
                if (!user) {
                  throw new Error('Cannot login: user not found');
                }
                loginMutation.mutate({ user, password });
              }}
            >
              <VStack gap={32}>
                <VStack gap={24}>
                  <Input
                    id={inputId}
                    autoFocus={true}
                    type="password"
                    name="password"
                    placeholder="Enter password"
                    required={true}
                  />
                  {loginMutation.error ? (
                    <UIText kind="caption/regular" color="var(--negative-500)">
                      {(loginMutation.error as Error).message ||
                        'unknown error'}
                    </UIText>
                  ) : null}
                </VStack>
                <Button kind="primary" disabled={loginMutation.isLoading}>
                  {loginMutation.isLoading
                    ? 'Checking password...'
                    : 'Reveal Recovery Phrase'}
                </Button>
              </VStack>
            </form>
          </VStack>
          {isNarrowView ? null : faq}
        </Stack>
      </div>
      {isNarrowView ? (
        <div className={helperStyles.faqContainer}>{faq}</div>
      ) : null}
      <PrivacyFooter />
    </VStack>
  );
}

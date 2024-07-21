import React, { useEffect, useMemo, useState } from 'react';
import { VStack } from 'src/ui/ui-kit/VStack';
import { PrivacyFooter } from 'src/ui/components/PrivacyFooter';
import { UIText } from 'src/ui/ui-kit/UIText';
import { Button } from 'src/ui/ui-kit/Button';
import ArrowLeftIcon from 'jsx:src/ui/assets/arrow-left.svg';
import { zeroizeAfterSubmission } from 'src/ui/shared/zeroize-submission';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { Input } from 'src/ui/ui-kit/Input';
import { isSessionExpiredError } from 'src/ui/shared/isSessionExpiredError';
import { useWindowSizeStore } from 'src/ui/shared/useWindowSizeStore';
import { useMnemonicInput } from 'src/ui/shared/useMnemonicInput';
import * as helperStyles from 'src/ui/features/onboarding/shared/helperStyles.module.css';
import { useMutation } from '@tanstack/react-query';
import { invariant } from 'src/shared/invariant';
import { useGoBack } from 'src/ui/shared/navigation/useGoBack';
import { useRecoveryPhrase } from './useRecoveryPhrase';
import { clipboardWarning } from './clipboardWarning';

const INPUT_NUMBER = 12;
const ARRAY_OF_NUMBERS = Array.from({ length: INPUT_NUMBER }, (_, i) => i);

export function VerifyBackup({
  groupId,
  onSessionExpired,
  onSuccess,
}: {
  groupId?: string;
  onSessionExpired(): void;
  onSuccess(): void;
}) {
  const { isNarrowView } = useWindowSizeStore();
  const [value, setValue] = useState(() => ARRAY_OF_NUMBERS.map(() => ''));
  const isTechnicalHint = clipboardWarning.isWarningMessage(value.join(' '));

  const { getInputProps } = useMnemonicInput({
    setValue,
    maxInputNumber: INPUT_NUMBER,
    type: isTechnicalHint ? 'text' : undefined,
  });

  const {
    data: recoveryPhrase,
    isLoading,
    error,
  } = useRecoveryPhrase({ groupId });

  useEffect(() => {
    if (isSessionExpiredError(error)) {
      onSessionExpired();
    }
  }, [onSessionExpired, error]);

  const verifyMutation = useMutation({
    mutationFn: async (value: string) => {
      invariant(recoveryPhrase, 'recoveryPhrase is missing');
      if (recoveryPhrase !== value) {
        throw new Error('Incorrect seed phrase');
      }
    },
    onSuccess: async () => {
      zeroizeAfterSubmission();
      onSuccess();
    },
  });

  const errorStyle = useMemo<React.CSSProperties>(
    () =>
      isNarrowView
        ? {
            position: 'absolute',
            bottom: 48,
            left: 0,
            right: 0,
            textAlign: 'center',
          }
        : { position: 'absolute', bottom: -24 },
    [isNarrowView]
  );

  const goBack = useGoBack();

  return (
    <VStack gap={isNarrowView ? 16 : 56}>
      <div
        className={helperStyles.container}
        style={{ justifyContent: 'center', paddingBlock: 60 }}
      >
        <UnstyledButton
          aria-label="Exit creating wallet"
          className={helperStyles.backButton}
          onClick={goBack}
        >
          <ArrowLeftIcon style={{ width: 20, height: 20 }} />
        </UnstyledButton>
        <VStack gap={40} style={{ maxWidth: 340 }}>
          <VStack gap={8}>
            <UIText kind="headline/h2">
              To Continue,
              <br />
              Verify Your Recovery Phrase
            </UIText>
            <UIText kind="body/regular">
              This step ensures you’ve saved your recovery phrase correctly
            </UIText>
          </VStack>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              verifyMutation.mutate(value.join(' '));
            }}
          >
            <VStack gap={40} style={{ position: 'relative' }}>
              <div className={helperStyles.phraseInputGrip}>
                {ARRAY_OF_NUMBERS.map((index) => (
                  <div key={index} style={{ position: 'relative' }}>
                    <Input
                      {...getInputProps(index)}
                      id={`word-${index}`}
                      name={`word-${index}`}
                      style={{ width: '100%', paddingLeft: 30 }}
                      value={value[index]}
                    />
                    <UIText
                      kind="body/regular"
                      color="var(--neutral-600)"
                      style={{
                        position: 'absolute',
                        left: 12,
                        top: 10,
                        userSelect: 'none',
                      }}
                    >
                      {index + 1}.
                    </UIText>
                  </div>
                ))}
              </div>
              <Button
                kind="primary"
                style={{ width: '100%' }}
                disabled={isLoading}
              >
                Verify
              </Button>
              {verifyMutation.isError ? (
                <UIText
                  kind="caption/regular"
                  color="var(--negative-500)"
                  style={errorStyle}
                >
                  {getError(verifyMutation.error).message}
                </UIText>
              ) : isTechnicalHint ? (
                <UIText kind="caption/regular" color="var(--notice-500)">
                  Your clipboard was cleared after copying the recovery phrase.
                  If saved, you can now paste it here.
                </UIText>
              ) : null}
            </VStack>
          </form>
        </VStack>
      </div>
      <PrivacyFooter />
    </VStack>
  );
}

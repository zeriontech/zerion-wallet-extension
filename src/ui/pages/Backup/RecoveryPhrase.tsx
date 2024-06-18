import React, { useEffect } from 'react';
import { VStack } from 'src/ui/ui-kit/VStack';
import { PrivacyFooter } from 'src/ui/components/PrivacyFooter';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { UIText } from 'src/ui/ui-kit/UIText';
import { Button } from 'src/ui/ui-kit/Button';
import { Surface } from 'src/ui/ui-kit/Surface';
import CheckIcon from 'jsx:src/ui/assets/check.svg';
import ArrowLeftIcon from 'jsx:src/ui/assets/arrow-left.svg';
import { HStack } from 'src/ui/ui-kit/HStack';
import { useCopyToClipboard } from 'src/ui/shared/useCopyToClipboard';
import CopyIcon from 'jsx:src/ui/assets/copy.svg';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import { SeedType } from 'src/shared/SeedType';
import { useWindowSizeStore } from 'src/ui/shared/useWindowSizeStore';
import * as helperStyles from 'src/ui/features/onboarding/shared/helperStyles.module.css';
import { isSessionExpiredError } from 'src/ui/shared/isSessionExpiredError';
import { BlurredToggle } from 'src/ui/components/BlurredToggle';
import { useGoBack } from 'src/ui/shared/navigation/useGoBack';
import { decodeMasked } from 'src/shared/wallet/encode-locally';
import {
  usePendingRecoveryPhrase,
  useRecoveryPhrase,
} from './useRecoveryPhrase';
import { clipboardWarning } from './clipboardWarning';

export function RecoveryPhrase({
  groupId,
  onNextStep,
  onSkip,
  onSessionExpired,
}: {
  groupId: string | null;
  onNextStep: () => void;
  onSkip?: () => void;
  onSessionExpired: () => void;
}) {
  const { isNarrowView } = useWindowSizeStore();

  const isPendingWallet = !groupId;
  const existingRecoveryPhraseQuery = useRecoveryPhrase({
    groupId,
    enabled: !isPendingWallet,
  });
  const pendingRecoveryPhraseQuery = usePendingRecoveryPhrase({
    enabled: isPendingWallet,
  });

  const {
    data: encoded,
    isLoading,
    isError,
    error,
  } = isPendingWallet
    ? pendingRecoveryPhraseQuery
    : existingRecoveryPhraseQuery;

  const recoveryPhrase = encoded ? decodeMasked(encoded) : null;

  useEffect(() => {
    if (isError && isSessionExpiredError(error)) {
      onSessionExpired();
    }
  }, [isError, error, onSessionExpired]);

  const { handleCopy, isSuccess: isCopySuccess } = useCopyToClipboard({
    text: recoveryPhrase || '',
  });

  const { handleCopy: emptyClipboard } = useCopyToClipboard({
    // We replace user clipboard with a warning message.
    // This works as "emptying" the clipboard, but it's more helpful
    // than just putting empty string there, in my opinion.
    // Also, if we see the user pasting this message, we can show a more
    // detailed message about what's going on.
    text: clipboardWarning.getMessage(SeedType.mnemonic),
  });

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
        <VStack gap={0} style={{ maxWidth: 340 }}>
          <UIText kind="headline/h2">Let’s Back Up Your Wallet!</UIText>
          <Spacer height={8} />
          <UIText kind="body/regular">
            Save these{' '}
            {recoveryPhrase ? recoveryPhrase.split(/\s+/).length : ''} words in
            a password manager or write them down and store in a secure location
          </UIText>
          <Spacer height={40} />
          {isLoading ? (
            <div
              style={{
                height: 100,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <CircleSpinner />
            </div>
          ) : (
            <Surface
              padding={12}
              style={{
                backgroundColor: 'var(--neutral-200)',
                paddingBottom: 0,
                paddingRight: 0,
              }}
            >
              <BlurredToggle>
                <UIText
                  kind="body/regular"
                  style={{
                    userSelect: 'none',
                    wordBreak: 'break-word',
                    paddingBottom: 40,
                    paddingRight: 12,
                  }}
                >
                  {recoveryPhrase}
                </UIText>
              </BlurredToggle>
            </Surface>
          )}
          <Spacer height={4} />
          {isLoading || error ? (
            <div style={{ height: 180 }} />
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <Button
                  kind="ghost"
                  onClick={handleCopy}
                  style={{ paddingInline: 32 }}
                >
                  <HStack gap={8}>
                    {React.createElement(isCopySuccess ? CheckIcon : CopyIcon, {
                      style: { display: 'block', width: 20, height: 20 },
                    })}
                    {isCopySuccess ? (
                      <span>Copied to Clipboard</span>
                    ) : (
                      <span>Copy to Clipboard</span>
                    )}
                  </HStack>
                </Button>
              </div>
              <Spacer height={32} />
              <VStack gap={16}>
                <Button
                  disabled={isLoading || Boolean(error)}
                  onClick={() => {
                    emptyClipboard();
                    onNextStep();
                  }}
                >
                  Verify Backup
                </Button>
                {onSkip ? (
                  <Button kind="ghost" onClick={onSkip}>
                    Do it Later
                  </Button>
                ) : null}
              </VStack>
            </>
          )}
        </VStack>
      </div>
      <PrivacyFooter />
    </VStack>
  );
}

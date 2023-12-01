import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { BlurredToggle } from 'src/ui/pages/BackupWallet/BlurredToggle';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import { clipboardWarning } from 'src/ui/pages/BackupWallet/clipboardWarning';
import { SeedType } from 'src/shared/SeedType';
import { useSizeStore } from '../useSizeStore';
import * as helperStyles from '../shared/helperStyles.module.css';
import { isSessionExpiredError } from '../shared/isSessionExpiredError';
import { usePendingRecoveryPhrase } from '../shared/usePendingRecoveryPhrase';

export function Backup({
  onNextStep,
  onSkip,
}: {
  onNextStep(): void;
  onSkip(): void;
}) {
  const { isNarrowView } = useSizeStore();
  const navigate = useNavigate();
  const { data: mnemonic, error, isLoading } = usePendingRecoveryPhrase();

  useEffect(() => {
    if (isSessionExpiredError(error)) {
      navigate('/onboarding/session-expired', { replace: true });
    }
  }, [navigate, error]);

  const { handleCopy, isSuccess: isCopySuccess } = useCopyToClipboard({
    text: mnemonic || '',
  });

  const { handleCopy: emptyClipboard } = useCopyToClipboard({
    // We replace user clipboard with a warning message.
    // This works as "emptying" the clipboard, but it's more helpful
    // than just putting empty string there, in my opinion.
    // Also, if we see the user pasting this message, we can show a more
    // detailed message about what's going on.
    text: clipboardWarning.getMessage(SeedType.mnemonic),
  });

  return (
    <VStack gap={isNarrowView ? 16 : 56}>
      <div
        className={helperStyles.container}
        style={{ justifyContent: 'center', paddingBlock: 60 }}
      >
        <UnstyledButton
          aria-label="Exit creating wallet"
          className={helperStyles.backButton}
          onClick={() => navigate(-1)}
        >
          <ArrowLeftIcon style={{ width: 20, height: 20 }} />
        </UnstyledButton>
        <VStack gap={0} style={{ maxWidth: 340 }}>
          <UIText kind="headline/h2">Let’s Back Up Your Wallet!</UIText>
          <Spacer height={8} />
          <UIText kind="body/regular">
            Save these 12 words in a password manager or write them down and
            store in a secure location
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
                  {mnemonic}
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
                <Button kind="ghost" onClick={onSkip}>
                  Do it Later
                </Button>
              </VStack>
            </>
          )}
        </VStack>
      </div>
      <PrivacyFooter />
    </VStack>
  );
}

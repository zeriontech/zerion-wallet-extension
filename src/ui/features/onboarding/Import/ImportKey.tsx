import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Content } from 'react-area';
import { validate } from 'src/ui/pages/GetStarted/ImportWallet/ImportWallet';
import { prepareUserInputSeedOrPrivateKey } from 'src/ui/shared/prepareUserInputSeedOrPrivateKey';
import type { ValidationResult } from 'src/shared/validation/ValidationResult';
import { Button } from 'src/ui/ui-kit/Button';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { walletPort } from 'src/ui/shared/channels';
import { getError } from 'src/shared/errors/getError';
import { HStack } from 'src/ui/ui-kit/HStack';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import { zeroizeAfterSubmission } from 'src/ui/shared/zeroize-submission';
import { Input } from 'src/ui/ui-kit/Input';
import type { ExternallyOwnedAccount } from 'src/shared/types/ExternallyOwnedAccount';
import { useWindowSizeStore } from 'src/ui/shared/useWindowSizeStore';
import { SecretKeyFAQ } from '../FAQ';

export function ImportKey({
  onWalletCreate,
}: {
  onWalletCreate(wallet: ExternallyOwnedAccount): void;
}) {
  const { isNarrowView } = useWindowSizeStore();
  const [validation, setValidation] = useState<ValidationResult | null>(null);

  const { mutate, isLoading } = useMutation({
    mutationFn: async (value: string) => {
      setValidation(null);
      const secretKey = prepareUserInputSeedOrPrivateKey(value);
      const validity = validate({ recoveryInput: secretKey });
      setValidation(validity);
      if (!validity.valid) {
        return;
      }
      return walletPort.request('uiImportPrivateKey', secretKey);
    },
    onSuccess: (wallet) => {
      if (wallet) {
        zeroizeAfterSubmission();
        onWalletCreate(wallet);
      }
    },
    onError: (error) => {
      setValidation({
        valid: false,
        message: getError(error).message,
      });
    },
  });

  return (
    <>
      <VStack gap={isNarrowView ? 16 : 52}>
        <VStack gap={8}>
          <UIText kind="headline/h2">Private key</UIText>
          <UIText kind="body/regular">
            Import an existing wallet with your private key.
          </UIText>
        </VStack>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const value = new FormData(e.currentTarget).get('key') as string;
            mutate(value);
          }}
        >
          <VStack gap={32} style={{ position: 'relative' }}>
            <Input
              name="key"
              placeholder="Private key"
              style={{ width: '100%' }}
              type="password"
              required={true}
              autoFocus={true}
            />
            <Button
              kind="primary"
              style={{ width: '100%' }}
              disabled={isLoading}
            >
              <HStack gap={8} alignItems="center" justifyContent="center">
                <span>Import wallet</span>
                {isLoading ? <CircleSpinner /> : null}
              </HStack>
            </Button>
            {!validation || validation.valid ? null : (
              <UIText
                kind="caption/regular"
                color="var(--negative-500)"
                style={{ position: 'absolute', top: 48 }}
              >
                {validation.message}
              </UIText>
            )}
          </VStack>
        </form>
      </VStack>
      <Content name="onboarding-faq">
        <SecretKeyFAQ />
      </Content>
    </>
  );
}

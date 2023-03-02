import React, { useState } from 'react';
import { useMutation } from 'react-query';
import { validate } from 'src/ui/pages/GetStarted/ImportWallet/ImportWallet';
import { prepareUserInputSeedOrPrivateKey } from 'src/ui/shared/prepareUserInputSeedOrPrivateKey';
import type { ValidationResult } from 'src/shared/validation/ValidationResult';
import { Button } from 'src/ui/ui-kit/Button';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import type { BareWallet } from 'src/shared/types/BareWallet';
import { walletPort } from 'src/ui/shared/channels';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import { Input } from './Input';

export function ImportKey({
  address,
  onWalletCreate,
}: {
  address?: string;
  onWalletCreate(wallet: BareWallet): void;
}) {
  const [validation, setValidation] = useState<ValidationResult | null>(null);

  const { mutate, isLoading } = useMutation(
    async (value: string) => {
      setValidation(null);
      const secretKey = prepareUserInputSeedOrPrivateKey(value);
      const validity = validate({ recoveryInput: secretKey });
      setValidation(validity);
      if (!validity.valid) {
        return;
      }
      const wallet = await walletPort.request('uiImportPrivateKey', secretKey);
      if (
        address &&
        normalizeAddress(wallet.address) !== normalizeAddress(address)
      ) {
        setValidation({
          valid: false,
          message: "You're trying to import another wallet",
        });
        return;
      }
      return wallet;
    },
    {
      onSuccess: (wallet) => {
        if (wallet) {
          onWalletCreate(wallet);
        }
      },
    }
  );

  return (
    <VStack gap={52}>
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
          />
          <Button kind="primary" style={{ width: '100%' }} disabled={isLoading}>
            Import wallet
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
          {isLoading ? (
            <UIText
              kind="caption/regular"
              style={{ position: 'absolute', top: 48 }}
            >
              Parsing secret key
            </UIText>
          ) : null}
        </VStack>
      </form>
    </VStack>
  );
}

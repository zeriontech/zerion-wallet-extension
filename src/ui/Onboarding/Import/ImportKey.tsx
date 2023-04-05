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
import { getError } from 'src/shared/errors/getError';
import { HStack } from 'src/ui/ui-kit/HStack';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import { useSizeStore } from '../useSizeStore';
import { useWhitelistStatus } from '../checkWhitelistStatus';
import { Input } from './Input';

export function ImportKey({
  address,
  onWalletCreate,
}: {
  address: string;
  onWalletCreate(wallet: BareWallet): void;
}) {
  const { isNarrowView } = useSizeStore();
  const [validation, setValidation] = useState<ValidationResult | null>(null);

  const { data: isWhiteListedResponse, isLoading: isWhitelistStatusLoading } =
    useWhitelistStatus(address);

  const { mutate, isLoading } = useMutation(
    async (value: string) => {
      setValidation(null);
      if (!isWhiteListedResponse?.status) {
        throw new Error("You're not whitelisted");
      }
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
        throw new Error("You're trying to import another wallet");
      }

      return wallet;
    },
    {
      onSuccess: (wallet) => {
        if (wallet) {
          onWalletCreate(wallet);
        }
      },
      onError: (error) => {
        setValidation({
          valid: false,
          message: getError(error).message,
        });
      },
    }
  );

  return (
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
            disabled={isLoading || isWhitelistStatusLoading}
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
  );
}

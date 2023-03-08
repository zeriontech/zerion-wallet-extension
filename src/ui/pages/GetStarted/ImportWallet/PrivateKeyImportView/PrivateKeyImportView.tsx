import React, { useEffect, useRef, useState } from 'react';
import { useMutation } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { accountPublicRPCPort, walletPort } from 'src/ui/shared/channels';
import { PageBottom } from 'src/ui/components/PageBottom';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { Button } from 'src/ui/ui-kit/Button';
import { isValidPrivateKey } from 'src/shared/validation/wallet';
import { setCurrentAddress } from 'src/ui/shared/requests/setCurrentAddress';
import { getError } from 'src/shared/errors/getError';
import { IdempotentRequest } from 'src/ui/shared/IdempotentRequest';
import {
  DecorativeMessage,
  DecorativeMessageDone,
} from '../../components/DecorativeMessage';
import {
  MemoryLocationState,
  useMemoryLocationState,
} from '../memoryLocationState';

function PrivateKeyImportFlow({
  address,
  errorMessage,
  onSubmit,
  isPreparing,
}: {
  address: string | null;
  errorMessage: string | null;
  onSubmit: () => void;
  isPreparing: boolean;
}) {
  const autoFocusRef = useRef<HTMLButtonElement | null>(null);
  const isDonePreparing = !isPreparing;
  useEffect(() => {
    if (isDonePreparing) {
      autoFocusRef.current?.focus();
    }
  }, [isDonePreparing]);
  return (
    <>
      <VStack gap={8}>
        <DecorativeMessage
          text={
            <UIText kind="small/regular">
              Hi 👋 We're generating your wallet and making sure it's encrypted
              with your passcode. This should only take a couple of minutes.
            </UIText>
          }
        />
        {address ? (
          <DecorativeMessageDone messageKind="import" address={address} />
        ) : null}
        {errorMessage ? (
          <UIText kind="small/regular" color="var(--negative-500)">
            Could not import wallet {errorMessage ? `(${errorMessage})` : null}
          </UIText>
        ) : null}
      </VStack>

      <Button
        ref={autoFocusRef}
        style={{ marginTop: 'auto', marginBottom: 16 }}
        onClick={onSubmit}
        disabled={isPreparing}
      >
        {isPreparing ? 'Recovering...' : 'Finish'}
      </Button>
    </>
  );
}

export function PrivateKeyImportView({
  locationStateStore,
}: {
  locationStateStore: MemoryLocationState;
}) {
  const [idempotentRequest] = useState(() => new IdempotentRequest());
  const { value: privateKey } = useMemoryLocationState(locationStateStore);
  if (!privateKey) {
    throw new Error(
      'Location state for PrivateKeyImportView is expected to have a value property'
    );
  }
  const navigate = useNavigate();
  const { data, mutate, isIdle, isError, ...importWallet } = useMutation(
    async (input: string) => {
      await new Promise((r) => setTimeout(r, 1000));
      if (isValidPrivateKey(input)) {
        return idempotentRequest.request(input, async () => {
          const wallet = await walletPort.request('uiImportPrivateKey', input);
          await accountPublicRPCPort.request('saveUserAndWallet');
          await setCurrentAddress({ address: wallet.address });
          return wallet;
        });
      } else {
        throw new Error('Not a private key');
      }
    }
  );
  const importError = isError ? getError(importWallet.error) : null;

  useEffect(() => {
    // NOTE:
    // In React.StrictMode this gets called twice >:
    // Creating a ref guard didn't work: the component does not receive the success
    // result from useMutation.
    // The current implementation of "mutate" is idempotent, that's why this is safe
    mutate(privateKey);
  }, [privateKey, mutate]);

  if (isIdle) {
    return null;
  }
  return (
    <PageColumn>
      <PageTop />

      <PrivateKeyImportFlow
        address={data?.address ?? null}
        errorMessage={importError?.message ?? null}
        isPreparing={importWallet.isLoading}
        onSubmit={() => navigate('/overview')}
      />
      <PageBottom />
    </PageColumn>
  );
}

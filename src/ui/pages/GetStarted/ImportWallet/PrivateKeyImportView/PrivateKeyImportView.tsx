import React, { useEffect } from 'react';
import { useMutation } from 'react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { accountPublicRPCPort, walletPort } from 'src/ui/shared/channels';
import { PageBottom } from 'src/ui/components/PageBottom';
import { VStack } from 'src/ui/ui-kit/VStack';
import {
  DecorativeMessage,
  DecorativeMessageDone,
} from '../../components/DecorativeMessage';
import { UIText } from 'src/ui/ui-kit/UIText';
import { Button } from 'src/ui/ui-kit/Button';
import { isValidPrivateKey } from 'src/shared/validation/wallet';

function PrivateKeyImportFlow({
  address,
  errorMessage,
  onSubmit,
  isSubmitting,
}: {
  address: string | null;
  errorMessage: string | null;
  onSubmit: () => void;
  isSubmitting: boolean;
}) {
  return (
    <>
      <VStack gap={8}>
        <DecorativeMessage
          text={
            <UIText kind="subtitle/m_reg">
              Hi 👋 We're generating your wallet and making sure it's encrypted
              with your passcode. This should only take a couple of minutes.
            </UIText>
          }
        />
        {address ? (
          <DecorativeMessageDone messageKind="import" address={address} />
        ) : null}
        {errorMessage ? (
          <UIText kind="subtitle/m_reg" color="var(--negative-500)">
            Could not import wallet {errorMessage ? `(${errorMessage})` : null}
          </UIText>
        ) : null}
      </VStack>

      <Button
        style={{ marginTop: 'auto', marginBottom: 16 }}
        onClick={onSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Recovering...' : 'Finish'}
      </Button>
    </>
  );
}

export function PrivateKeyImportView() {
  const { state: locationState } = useLocation();
  const { value: privateKey } = locationState as { value: string };
  if (!privateKey) {
    throw new Error(
      'Location state for PrivateKeyImportView is expected to have a value property'
    );
  }
  const navigate = useNavigate();
  const { data, mutate, isIdle, ...importWallet } = useMutation(
    async (input: string) => {
      await new Promise((r) => setTimeout(r, 1000));
      if (isValidPrivateKey(input)) {
        return walletPort.request('uiImportPrivateKey', input);
      } else {
        throw new Error('Not a private key');
      }
    }
  );
  const importError = importWallet.error ? (importWallet.error as Error) : null;

  useEffect(() => {
    // NOTE:
    // In React.StrictMode this gets called twice >:
    // Creating a ref guard didn't work: the component does not receive the success
    // result from useMutation.
    // I'll leave this as is, this doesn't break anything atm
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
        isSubmitting={importWallet.isLoading}
        onSubmit={async () => {
          await accountPublicRPCPort.request('saveUserAndWallet');
          if (data?.address) {
            await walletPort.request('setCurrentAddress', {
              address: data.address,
            });
          }
          navigate('/overview');
        }}
      />
      <PageBottom />
    </PageColumn>
  );
}

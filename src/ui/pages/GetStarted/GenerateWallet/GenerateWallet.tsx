import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageHeading } from 'src/ui/components/PageHeading';
import { PageTop } from 'src/ui/components/PageTop';
import { accountPublicRPCPort, walletPort } from 'src/ui/shared/channels';
import { Button } from 'src/ui/ui-kit/Button';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { getError } from 'src/shared/errors/getError';
import { WithPasswordSession } from 'src/ui/components/VerifyUser/WithPasswordSession';
import { PageBottom } from 'src/ui/components/PageBottom';
import { focusNode } from 'src/ui/shared/focusNode';
import { setCurrentAddress } from 'src/ui/shared/requests/setCurrentAddress';
import { IdempotentRequest } from 'src/ui/shared/IdempotentRequest';
import { invariant } from 'src/shared/invariant';
import { assertKnownEcosystems } from 'src/shared/wallet/shared';
import {
  DecorativeMessage,
  DecorativeMessageDone,
} from '../components/DecorativeMessage';

enum Step {
  loading,
  done,
}

function GenerateWalletView() {
  const [params] = useSearchParams();
  const ecosystems = params.getAll('ecosystems');
  invariant(ecosystems.length > 0, 'Must provide ecosystems get-param');
  assertKnownEcosystems(ecosystems);
  const [steps, setSteps] = useState(() => new Set<Step>());
  const addStep = (step: Step) => setSteps((steps) => new Set(steps).add(step));

  const [idempotentRequest] = useState(() => new IdempotentRequest());

  const {
    mutate: generateMnemonicWallet,
    data: generatedWallets,
    isLoading,
    status,
    isSuccess,
  } = useMutation({
    mutationFn: async () => {
      addStep(Step.loading);
      await new Promise((r) => setTimeout(r, 1000));
      return walletPort.request('uiGenerateMnemonic', { ecosystems });
    },
    useErrorBoundary: true,
    onSuccess() {
      addStep(Step.done);
    },
  });
  useEffect(() => {
    if (status === 'idle') {
      // This is invoked twice in StrictMode, it's fine
      generateMnemonicWallet();
    }
  }, [generateMnemonicWallet, status]);

  const { mutate: finalize, ...finalizeMutation } = useMutation({
    mutationFn: async (address: string) => {
      return idempotentRequest.request(address, async () => {
        await accountPublicRPCPort.request('saveUserAndWallet');
        return setCurrentAddress({ address });
      });
    },
  });

  useEffect(() => {
    if (generatedWallets) {
      // NOTE: Make sure "finalize" is idempotent
      finalize(generatedWallets[0].address);
    }
  }, [generatedWallets, finalize]);

  return (
    <PageColumn>
      <PageTop />
      <NavigationTitle title={null} documentTitle="Get Started" />
      <PageHeading>Get Started</PageHeading>

      <Spacer height={32} />

      <VStack gap={16}>
        <VStack gap={8}>
          <DecorativeMessage
            animate={false}
            text={
              <UIText kind="small/regular">
                Wallet will be encrypted with your password
              </UIText>
            }
          />
          {steps.has(Step.loading) ? (
            <DecorativeMessage
              text={
                <UIText kind="small/regular">
                  Hi 👋 We're generating your wallet and making sure it's
                  encrypted with your passcode. This should only take a couple
                  of minutes.
                </UIText>
              }
            />
          ) : null}
          {generatedWallets ? (
            <DecorativeMessageDone
              addresses={generatedWallets.map((wallet) => wallet.address)}
              confettiOriginY={0.87}
            />
          ) : null}
        </VStack>
      </VStack>
      {isSuccess ? null : (
        <Button
          style={{ marginTop: 'auto' }}
          disabled={isLoading}
          onClick={() => {
            generateMnemonicWallet();
          }}
        >
          {isLoading ? 'Generating...' : 'Generate new Wallet'}
        </Button>
      )}
      {isSuccess ? (
        <VStack gap={4} style={{ marginTop: 'auto' }}>
          {finalizeMutation.isError ? (
            <UIText
              style={{ textAlign: 'center', overflowWrap: 'break-word' }}
              kind="caption/regular"
              color="var(--negative-500)"
            >
              {getError(finalizeMutation.error).message}
            </UIText>
          ) : null}
          {finalizeMutation.isSuccess ? (
            <Button as={UnstyledLink} to="/overview" ref={focusNode}>
              Finish
            </Button>
          ) : null}
        </VStack>
      ) : null}
      <PageBottom />
    </PageColumn>
  );
}

export function GenerateWallet() {
  return (
    <WithPasswordSession>
      <GenerateWalletView />
    </WithPasswordSession>
  );
}

import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { PageColumn } from 'src/ui/components/PageColumn';
import { accountPublicRPCPort, walletPort } from 'src/ui/shared/channels';
import { Button } from 'src/ui/ui-kit/Button';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { getError } from 'src/shared/errors/getError';
import { WithPasswordSession } from 'src/ui/components/VerifyUser/WithPasswordSession';
import { setCurrentAddress } from 'src/ui/shared/requests/setCurrentAddress';
import { IdempotentRequest } from 'src/ui/shared/IdempotentRequest';
import { invariant } from 'src/shared/invariant';
import { assertKnownEcosystems } from 'src/shared/wallet/shared';
import { useBackgroundKind } from 'src/ui/components/Background';
import { animated } from '@react-spring/web';
import { useTransformTrigger } from 'src/ui/components/useTransformTrigger';
import {
  ImportBackground,
  ImportDecoration,
} from '../components/importDecoration/ImportDecoration';

function GenerateWalletView() {
  useBackgroundKind({ kind: 'transparent' });
  const [params] = useSearchParams();
  const ecosystems = params.getAll('ecosystems');
  invariant(ecosystems.length > 0, 'Must provide ecosystems get-param');
  assertKnownEcosystems(ecosystems);

  const [idempotentRequest] = useState(() => new IdempotentRequest());

  const {
    mutate: generateMnemonicWallet,
    data: generatedWallets,
    isLoading,
    status,
  } = useMutation({
    mutationFn: async () => {
      await new Promise((r) => setTimeout(r, 1000));
      return walletPort.request('uiGenerateMnemonic', { ecosystems });
    },
    useErrorBoundary: true,
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

  const ready = !isLoading && !finalizeMutation.isLoading;

  const { style, trigger } = useTransformTrigger({
    scale: 1.1,
    timing: 100,
  });
  useEffect(() => {
    if (ready && finalizeMutation.isSuccess) {
      trigger();
    }
  }, [finalizeMutation.isSuccess, ready, trigger]);

  const autoFocusRef = useRef<HTMLAnchorElement | null>(null);
  useEffect(() => {
    if (ready) {
      setTimeout(() => autoFocusRef.current?.focus(), 100);
    }
  }, [ready]);

  return (
    <PageColumn>
      <NavigationTitle title={null} documentTitle="Get Started" />

      <ImportBackground animate={!ready} />
      <ImportDecoration
        wallets={generatedWallets || []}
        isLoading={!ready}
        loadingTitle="Generating wallets"
      />

      <VStack
        gap={4}
        style={{
          marginTop: 'auto',
          marginBottom: 16,
          position: 'relative',
          height: 44,
        }}
      >
        {finalizeMutation.isError ? (
          <UIText
            style={{ textAlign: 'center', overflowWrap: 'break-word' }}
            kind="caption/regular"
            color="var(--negative-500)"
          >
            {getError(finalizeMutation.error).message}
          </UIText>
        ) : null}
        {ready && finalizeMutation.isSuccess && generatedWallets ? (
          <animated.div style={style}>
            <Button
              as={UnstyledLink}
              to="/overview"
              style={{ width: '100%' }}
              ref={autoFocusRef}
            >
              {generatedWallets.length > 1 ? 'View Wallets' : 'View Wallet'}
            </Button>
          </animated.div>
        ) : null}
      </VStack>
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

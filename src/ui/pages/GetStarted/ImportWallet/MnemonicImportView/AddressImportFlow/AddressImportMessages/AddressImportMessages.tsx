import { animated } from '@react-spring/web';
import { isTruthy } from 'is-truthy-ts';
import React, { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { PageColumn } from 'src/ui/components/PageColumn';
import { accountPublicRPCPort, walletPort } from 'src/ui/shared/channels';
import { Button } from 'src/ui/ui-kit/Button';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import type { MaskedBareWallet } from 'src/shared/types/BareWallet';
import { useTransformTrigger } from 'src/ui/components/useTransformTrigger';
import { getError } from 'src/shared/errors/getError';
import { ErrorBoundary } from 'src/ui/components/ErrorBoundary';
import { ViewError } from 'src/ui/components/ViewError';
import { IdempotentRequest } from 'src/ui/shared/IdempotentRequest';
import { setCurrentAddress } from 'src/ui/shared/requests/setCurrentAddress';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import {
  ImportBackground,
  ImportDecoration,
} from 'src/ui/pages/GetStarted/components/importDecoration/ImportDecoration';
import { useRenderDelay } from 'src/ui/components/DelayedRender/DelayedRender';
import { useBackgroundKind } from 'src/ui/components/Background';

export function OnMount({
  children,
  onMount,
}: React.PropsWithChildren<{ onMount: () => void }>) {
  const onMountRef = useRef(onMount);
  onMountRef.current = onMount;
  useEffect(() => {
    onMountRef.current();
  }, []);
  return children as React.ReactNode;
}

const ANIMATION_DURATION = 1500;

function AddressImportMessagesView({ values }: { values: MaskedBareWallet[] }) {
  useBackgroundKind({ kind: 'transparent' });
  const ready = useRenderDelay(ANIMATION_DURATION);
  const buttonFocusReady = useRenderDelay(ANIMATION_DURATION + 300);
  const [idempotentRequest] = useState(() => new IdempotentRequest());

  const {
    mutate: finalize,
    isSuccess,
    ...finalizeMutation
  } = useMutation({
    mutationFn: async (
      mnemonics: NonNullable<MaskedBareWallet['mnemonic']>[]
    ) => {
      return idempotentRequest.request(JSON.stringify(mnemonics), async () => {
        const data = await walletPort.request('uiImportSeedPhrase', mnemonics);
        await accountPublicRPCPort.request('saveUserAndWallet');
        if (data?.address) {
          await setCurrentAddress({ address: data.address });
        }
      });
    },
  });
  const { style, trigger } = useTransformTrigger({
    scale: 1.1,
    timing: 100,
  });
  useEffect(() => {
    if (ready && isSuccess) {
      trigger();
    }
  }, [isSuccess, ready, trigger]);

  useEffect(() => {
    if (ready) {
      const mnemonics = values
        .map((wallet) => wallet.mnemonic)
        .filter(isTruthy);
      // NOTE: Make sure "finalize" is idempotent
      finalize(mnemonics);
    }
  }, [finalize, ready, values]);

  const autoFocusRef = useRef<HTMLAnchorElement | null>(null);
  useEffect(() => {
    if (buttonFocusReady) {
      autoFocusRef.current?.focus();
    }
  }, [buttonFocusReady]);

  return (
    <PageColumn>
      <ImportBackground animate={!ready} />
      <ImportDecoration
        wallets={values}
        isLoading={!ready}
        loadingTitle="Importing wallets"
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
        {ready && isSuccess ? (
          <animated.div style={style}>
            <Button
              as={UnstyledLink}
              to="/overview"
              style={{ width: '100%' }}
              ref={autoFocusRef}
            >
              {values.length > 1 ? 'View Wallets' : 'View Wallet'}
            </Button>
          </animated.div>
        ) : null}
      </VStack>
    </PageColumn>
  );
}

export function AddressImportMessages({
  values,
}: {
  values: MaskedBareWallet[];
}) {
  return (
    <ErrorBoundary
      renderError={(error) => {
        if (error?.code === 2312103) {
          return (
            <ViewError
              title="Session Expired"
              error={new Error('You will need to enter your password again')}
            />
          );
        } else {
          throw error;
        }
      }}
    >
      <AddressImportMessagesView values={values} />
    </ErrorBoundary>
  );
}

import React, { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { PageColumn } from 'src/ui/components/PageColumn';
import { accountPublicRPCPort, walletPort } from 'src/ui/shared/channels';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { Button } from 'src/ui/ui-kit/Button';
import { isValidPrivateKey } from 'src/shared/validation/wallet';
import { setCurrentAddress } from 'src/ui/shared/requests/setCurrentAddress';
import { getError } from 'src/shared/errors/getError';
import { IdempotentRequest } from 'src/ui/shared/IdempotentRequest';
import type { LocallyEncoded } from 'src/shared/wallet/encode-locally';
import { decodeMasked } from 'src/shared/wallet/encode-locally';
import { unwrapOpaqueType } from 'src/shared/type-utils/Opaque';
import { animated } from '@react-spring/web';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import { useTransformTrigger } from 'src/ui/components/useTransformTrigger';
import { useBackgroundKind } from 'src/ui/components/Background';
import type { MemoryLocationState } from '../memoryLocationState';
import { useMemoryLocationState } from '../memoryLocationState';
import {
  ImportBackground,
  ImportDecoration,
} from '../../components/importDecoration/ImportDecoration';

export function PrivateKeyImportView({
  locationStateStore,
}: {
  locationStateStore: MemoryLocationState;
}) {
  useBackgroundKind({ kind: 'transparent' });
  const [idempotentRequest] = useState(() => new IdempotentRequest());
  const { value: privateKey } = useMemoryLocationState(locationStateStore);
  if (!privateKey) {
    throw new Error(
      'Location state for PrivateKeyImportView is expected to have a value property'
    );
  }
  const { data, mutate, isIdle, isError, ...importWallet } = useMutation({
    mutationFn: async (input: LocallyEncoded) => {
      await new Promise((r) => setTimeout(r, 1000));
      if (isValidPrivateKey(decodeMasked(input))) {
        return idempotentRequest.request(unwrapOpaqueType(input), async () => {
          const wallet = await walletPort.request('uiImportPrivateKey', input);
          await accountPublicRPCPort.request('saveUserAndWallet');
          await setCurrentAddress({ address: wallet.address });
          return wallet;
        });
      } else {
        throw new Error('Not a private key');
      }
    },
  });
  const importError = isError ? getError(importWallet.error) : null;

  useEffect(() => {
    // NOTE:
    // In React.StrictMode this gets called twice >:
    // Creating a ref guard didn't work: the component does not receive the success
    // result from useMutation.
    // The current implementation of "mutate" is idempotent, that's why this is safe
    mutate(privateKey);
  }, [privateKey, mutate]);

  const { style, trigger } = useTransformTrigger({
    scale: 1.1,
    timing: 100,
  });
  const ready = !importWallet.isLoading;
  useEffect(() => {
    if (ready) {
      trigger();
    }
  }, [ready, trigger]);

  const autoFocusRef = useRef<HTMLAnchorElement | null>(null);
  useEffect(() => {
    if (ready) {
      setTimeout(() => autoFocusRef.current?.focus(), 100);
    }
  }, [ready]);

  if (isIdle) {
    return null;
  }
  return (
    <PageColumn>
      <ImportBackground animate={!ready} />
      <ImportDecoration
        wallets={data ? [data] : []}
        isLoading={!ready}
        loadingTitle="Importing wallet"
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
        {importError?.message ? (
          <UIText
            style={{ textAlign: 'center', overflowWrap: 'break-word' }}
            kind="caption/regular"
            color="var(--negative-500)"
          >
            {importError.message}
          </UIText>
        ) : null}
        {ready ? (
          <animated.div style={style}>
            <Button
              as={UnstyledLink}
              to="/overview"
              style={{ width: '100%' }}
              ref={autoFocusRef}
            >
              View Wallet
            </Button>
          </animated.div>
        ) : null}
      </VStack>
    </PageColumn>
  );
}

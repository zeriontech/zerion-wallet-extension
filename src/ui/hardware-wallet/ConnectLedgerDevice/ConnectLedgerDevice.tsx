import {
  connectDevice,
  checkDevice,
  interpretError,
} from 'hardware-wallet-connection';
import { useMutation } from '@tanstack/react-query';
import React from 'react';
import { getError } from 'src/shared/errors/getError';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { Button } from 'src/ui/ui-kit/Button';
import { useBackgroundKind } from 'src/ui/components/Background/Background';
import type { DeviceConnection } from '../types';
import LedgerImage from '../assets/ledger-eth-app.png';

async function safelyConnectDevice() {
  try {
    return await checkDevice();
  } catch (e) {
    return connectDevice();
  }
}

export function ConnectLedgerDevice({
  onConnect,
}: {
  onConnect: (data: DeviceConnection) => void;
}) {
  useBackgroundKind({ kind: 'white' });
  const {
    mutate: invokeConnectDevice,
    isLoading,
    isSuccess,
    isError,
    error: maybeError,
  } = useMutation({
    mutationFn: () => safelyConnectDevice(),
    onSuccess: (data) => {
      onConnect(data);
    },
  });
  const error = isError ? getError(maybeError) : null;
  return (
    <VStack gap={28}>
      <img
        style={{ width: '100%' }}
        src={LedgerImage}
        alt="Picture of Ledger with an Ethereum App open"
      />
      <ol style={{ display: 'grid', gap: 20, margin: 0 }}>
        <li>Connect your Ledger to begin</li>
        <li>Open "Ethereum App" on your Ledger device</li>
        <li>
          Ensure that Browser Support and Contract Data are enabled in Settings
        </li>
      </ol>
      <UIText kind="small/regular" color="var(--neutral-500)">
        You may need to update firmware if Browser Support is not available
      </UIText>
      <VStack gap={8}>
        {error ? (
          <UIText kind="small/regular" color="var(--negative-500)">
            {interpretError(error)}
          </UIText>
        ) : null}
        <Button
          kind="primary"
          onClick={() => invokeConnectDevice()}
          style={{ width: '100%' }}
          // disable on isSuccess to prevent flick of button before redirect
          disabled={isLoading || isSuccess}
        >
          {isLoading || isSuccess ? 'Looking for device...' : 'Connect Device'}
        </Button>
      </VStack>
    </VStack>
  );
}

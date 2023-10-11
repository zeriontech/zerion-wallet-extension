import {
  connectDevice,
  checkDevice,
  interpretError,
} from '@zeriontech/hardware-wallet-connection';
import { useMutation } from '@tanstack/react-query';
import React from 'react';
import { getError } from 'src/shared/errors/getError';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { Button } from 'src/ui/ui-kit/Button';
import { PageFullBleedColumn } from 'src/ui/components/PageFullBleedColumn';
import LedgerIcon from 'jsx:src/ui/assets/ledger-icon.svg';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { HStack } from 'src/ui/ui-kit/HStack';
import { PageColumn } from 'src/ui/components/PageColumn';
import { AnimatedCheckmark } from 'src/ui/ui-kit/AnimatedCheckmark';
import type { DeviceConnection } from '../types';
import { ConnectIllustration } from './ConnectIllustration';

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
  const isPhysicallyConnected =
    error &&
    error.name !== 'TransportOpenUserCancelled' &&
    error.name !== 'Error';
  const title = 'Connect Your Ledger';
  return (
    <PageColumn style={{ height: '100%' }}>
      <VStack gap={24}>
        <NavigationTitle title={'lol'} documentTitle={title} />
        <div>
          <div
            style={{
              backgroundColor: 'var(--neutral-200)',
              borderRadius: '50%',
              padding: 10,
              height: 52,
              width: 52,
            }}
          >
            <LedgerIcon style={{ width: 32, height: 32 }} />
          </div>
        </div>
        <UIText kind="headline/hero">{title}</UIText>
        <UIText kind="headline/h3">Ensure your device:</UIText>
        <UIText kind="body/regular">
          <ol
            style={{
              display: 'grid',
              gap: 16,
              margin: 0,
              padding: 0,
              color: 'var(--neutral-700)',
              listStyle: 'none',
            }}
          >
            <li>
              <HStack gap={8}>
                <AnimatedCheckmark
                  checked={isSuccess || Boolean(isPhysicallyConnected)}
                  uncheckedColor="var(--neutral-400)"
                  checkedColor="var(--black)"
                />
                Is plugged into the computer.
              </HStack>
            </li>
            <li>
              <HStack gap={8}>
                <AnimatedCheckmark
                  checked={isSuccess}
                  uncheckedColor="var(--neutral-400)"
                  checkedColor="var(--black)"
                />
                Has Ethereum App installed and open.
              </HStack>
            </li>
          </ol>
        </UIText>
        <PageFullBleedColumn paddingInline={false}>
          <div>
            <Spacer height={40} />
            <ConnectIllustration />
            <Spacer height={40} />
          </div>
        </PageFullBleedColumn>
      </VStack>
      <div style={{ marginTop: 'auto' }}>
        {error ? (
          <UIText kind="small/regular" color="var(--negative-500)">
            {interpretError(error)}
          </UIText>
        ) : null}
        <Spacer height={24} />
        <Button
          kind="primary"
          onClick={() => invokeConnectDevice()}
          style={{ width: '100%' }}
          // disable on isSuccess to prevent flick of button before redirect
          disabled={isLoading || isSuccess}
        >
          {isLoading || isSuccess ? 'Looking for device...' : 'Connect'}
        </Button>
        <Spacer height={24} />
      </div>
    </PageColumn>
  );
}

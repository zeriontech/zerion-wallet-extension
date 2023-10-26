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

function CheckListItem({
  checked,
  text,
}: {
  checked: boolean;
  text: React.ReactNode;
}) {
  return (
    <li style={{ color: checked ? 'var(--black)' : 'var(--neutral-700)' }}>
      <HStack gap={8}>
        <AnimatedCheckmark
          checked={checked}
          uncheckedColor="var(--neutral-400)"
          checkedColor="var(--black)"
          tickColor="var(--white)"
        />
        {text}
      </HStack>
    </li>
  );
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
  const title = 'Connect Ledger';
  return (
    <PageColumn style={{ height: '100%' }} paddingInline={24}>
      <VStack gap={24}>
        <div>
          <div
            style={{
              backgroundColor: 'var(--black)',
              borderRadius: '50%',
              padding: 10,
              height: 52,
              width: 52,
            }}
          >
            <LedgerIcon
              style={{ color: 'var(--white)', width: 32, height: 32 }}
            />
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
              listStyle: 'none',
            }}
          >
            <CheckListItem
              checked={isSuccess || Boolean(isPhysicallyConnected)}
              text="Is plugged into the computer."
            />
            <CheckListItem
              checked={isSuccess}
              text="Has Ethereum App installed and open."
            />
          </ol>
        </UIText>
      </VStack>
      <PageFullBleedColumn paddingInline={false}>
        <div style={{ overflow: 'hidden' }}>
          <Spacer height={68} />
          <ConnectIllustration />
          <Spacer height={28} />
        </div>
      </PageFullBleedColumn>
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

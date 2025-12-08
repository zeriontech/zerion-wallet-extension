import type { TransportIdentifier } from '@zeriontech/hardware-wallet-connection';
import {
  connectDevice,
  parseLedgerError,
  transports,
} from '@zeriontech/hardware-wallet-connection';
import { useMutation } from '@tanstack/react-query';
import React from 'react';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { Button } from 'src/ui/ui-kit/Button';
import { PageFullBleedColumn } from 'src/ui/components/PageFullBleedColumn';
import LedgerIcon from 'jsx:src/ui/assets/ledger-icon.svg';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { HStack } from 'src/ui/ui-kit/HStack';
import { PageColumn } from 'src/ui/components/PageColumn';
import { AnimatedCheckmark } from 'src/ui/ui-kit/AnimatedCheckmark';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import type { DeviceConnection } from '../types';
import { ConnectIllustration } from './ConnectIllustration';

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
    mutationFn: async (transport: TransportIdentifier) => {
      const result = await connectDevice({ transportIdentifier: transport });
      return result;
    },
    onSuccess: (data) => {
      onConnect(data);
    },
  });
  const error = isError ? parseLedgerError(maybeError) : null;
  const isPhysicallyConnected =
    error &&
    error.name !== 'TransportOpenUserCancelled' &&
    error.name !== 'Error';

  const title = 'Connect Ledger';

  const userCancelledFlowError =
    error?._tag === 'NoAccessibleDeviceError' || // USB connection cancelled by user
    error?.message === 'User cancelled the requestDevice() chooser.'; // Bluetooth connection cancelled by user

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
              text="Is can be connected to the computer."
            />
            <CheckListItem
              checked={isSuccess}
              text="Has Ethereum App or Solana App installed."
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
        {error && !userCancelledFlowError ? (
          <UIText kind="small/regular" color="var(--negative-500)">
            {error.message}
          </UIText>
        ) : null}
        <Spacer height={24} />
        {/* disable on isSuccess to prevent flick of button before redirect */}
        {isLoading || isSuccess ? (
          <HStack alignItems="center" gap={24}>
            <CircleSpinner color="var(--primary)" size="24px" />
            <UIText kind="headline/h3">Connecting...</UIText>
          </HStack>
        ) : (
          <HStack gap={8} style={{ gridTemplateColumns: '1fr 1fr' }}>
            <Button
              kind="primary"
              onClick={() => invokeConnectDevice(transports.hid)}
            >
              Connect via USB
            </Button>

            <Button
              kind="primary"
              onClick={() => invokeConnectDevice(transports.bluetooth)}
            >
              Connect via Bluetooth
            </Button>
          </HStack>
        )}

        <Spacer height={24} />
      </div>
    </PageColumn>
  );
}

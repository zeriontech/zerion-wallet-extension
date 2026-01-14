import type { TransportIdentifier } from '@zeriontech/hardware-wallet-connection';
import {
  connectDevice,
  parseLedgerError,
  transports,
} from '@zeriontech/hardware-wallet-connection';
import { useMutation } from '@tanstack/react-query';
import React, { useRef } from 'react';
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
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { useEvent } from 'src/ui/shared/useEvent';
import { CenteredDialog } from 'src/ui/ui-kit/ModalDialogs/CenteredDialog';
import { isMacOS } from 'src/ui/shared/isMacos';
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

function BluetoothWarningDialog({ onSubmit }: { onSubmit: () => void }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <VStack gap={16}>
        <UIText kind="headline/h3">Enable Bluetooth Support</UIText>

        <div
          style={{
            backgroundColor: 'var(--neutral-100)',
            borderRadius: 8,
            padding: 12,
          }}
        >
          <UIText kind="small/regular" color="var(--neutral-700)">
            Due to browser limitations, signing flows for your hardware wallets
            will open in a tab view instead of popup or sidepanel.
          </UIText>
        </div>

        <UIText kind="caption/accent" color="var(--neutral-500)">
          You can turn this on or off anytime in{' '}
          <span style={{ textDecoration: 'underline' }}>
            Settings → Experiments.
          </span>
        </UIText>

        <Button kind="primary" style={{ width: '100%' }} onClick={onSubmit}>
          Enable Bluetooth Connection
        </Button>
      </VStack>
    </div>
  );
}

export function ConnectLedgerDevice({
  bluetoothSupportEnabled,
  onConnect,
  onBluetoothEnabled,
}: {
  bluetoothSupportEnabled: boolean | null;
  onConnect: (data: DeviceConnection) => void;
  onBluetoothEnabled: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElementInterface | null>(null);
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

  const onBluetoothEnabledEvent = useEvent(onBluetoothEnabled);

  return (
    <>
      <CenteredDialog
        ref={dialogRef}
        containerStyle={{ padding: 24, borderRadius: 16 }}
        style={{ width: 380, height: 'max-content' }}
      >
        <BluetoothWarningDialog
          onSubmit={() => {
            onBluetoothEnabledEvent();
            invokeConnectDevice(transports.bluetooth);
            dialogRef.current?.close();
          }}
        />
      </CenteredDialog>
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
                text="Connected to the computer."
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
            <HStack
              gap={8}
              style={{
                gridTemplateColumns:
                  bluetoothSupportEnabled !== false ? '1fr 1fr' : '1fr',
              }}
            >
              <Button
                kind="primary"
                onClick={() => invokeConnectDevice(transports.hid)}
                style={{ paddingInline: 16 }}
              >
                Connect via USB
              </Button>

              {bluetoothSupportEnabled ? (
                <Button
                  kind="primary"
                  onClick={() => invokeConnectDevice(transports.bluetooth)}
                  style={{ paddingInline: 16 }}
                >
                  Connect via Bluetooth
                </Button>
              ) : isMacOS() && bluetoothSupportEnabled == null ? (
                <div style={{ position: 'relative', width: '100%' }}>
                  <Button
                    kind="primary"
                    onClick={() => {
                      if (!dialogRef.current) {
                        return;
                      }
                      dialogRef.current.showModal();
                    }}
                    style={{ paddingInline: 16, width: '100%' }}
                  >
                    Connect via Bluetooth
                  </Button>
                  <div
                    style={{
                      position: 'absolute',
                      top: -8,
                      right: -8,
                      borderRadius: 8,
                      backgroundColor: 'var(--primary)',
                      padding: '2px 8px',
                    }}
                  >
                    <UIText kind="caption/accent" color="var(--always-white)">
                      Beta
                    </UIText>
                  </div>
                </div>
              ) : null}
            </HStack>
          )}

          <Spacer height={24} />
        </div>
      </PageColumn>
    </>
  );
}

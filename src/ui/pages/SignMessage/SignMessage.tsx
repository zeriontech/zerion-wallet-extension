import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { walletPort, windowPort } from 'src/ui/shared/channels';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { Button } from 'src/ui/ui-kit/Button';
import { Surface } from 'src/ui/ui-kit/Surface';
import { Background } from 'src/ui/components/Background';
import { PageStickyFooter } from 'src/ui/components/PageStickyFooter';
import { toUtf8String } from 'src/modules/ethereum/message-signing/toUtf8String';
import { getError } from 'src/shared/errors/getError';
import { invariant } from 'src/shared/invariant';
import { TextAnchor } from 'src/ui/ui-kit/TextAnchor';
import { HStack } from 'src/ui/ui-kit/HStack';
import { WalletDisplayName } from 'src/ui/components/WalletDisplayName';
import { WalletAvatar } from 'src/ui/components/WalletAvatar';
import { KeyboardShortcut } from 'src/ui/components/KeyboardShortcut';
import { usePersonalSignMutation } from 'src/ui/shared/requests/message-signing';
import { prepareForHref } from 'src/ui/shared/prepareForHref';
import { focusNode } from 'src/ui/shared/focusNode';
import { PhishingDefenceStatus } from 'src/ui/components/PhishingDefence/PhishingDefenceStatus';
import type { ExternallyOwnedAccount } from 'src/shared/types/ExternallyOwnedAccount';
import { isDeviceAccount } from 'src/shared/types/validators';
import { useErrorBoundary } from 'src/ui/shared/useErrorBoundary';
import { HardwareSignMessage } from '../HardwareWalletConnection/HardwareSignMessage';

function MessageRow({ message }: { message: string }) {
  return (
    <VStack gap={8}>
      <UIText kind="body/regular" color="var(--neutral-500)">
        Data to Sign
      </UIText>
      <Surface padding={16} style={{ border: '1px solid var(--neutral-300)' }}>
        <UIText
          kind="small/regular"
          style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}
        >
          {toUtf8String(message)}
        </UIText>
      </Surface>
    </VStack>
  );
}

function SignMessageContent({
  message,
  origin,
  wallet,
}: {
  message: string;
  origin: string;
  wallet: ExternallyOwnedAccount;
}) {
  const [params] = useSearchParams();
  const windowId = params.get('windowId');
  invariant(windowId, 'windowId get-parameter is required');
  const handleSignSuccess = (signature: string) =>
    windowPort.confirm(windowId, signature);

  const personalSignMutation = usePersonalSignMutation({
    onSuccess: handleSignSuccess,
  });

  const originForHref = useMemo(() => prepareForHref(origin), [origin]);

  const handleReject = () => windowPort.reject(windowId);

  const showErrorBoundary = useErrorBoundary();
  const [hardwareSignError, setHardwareSignError] = useState<Error | null>(
    null
  );

  return (
    <Background backgroundKind="white">
      <PageColumn
        // different surface color on backgroundKind="neutral"
        style={{
          ['--surface-background-color' as string]: 'var(--neutral-100)',
        }}
      >
        <PageTop />
        <div style={{ display: 'grid', placeItems: 'center' }}>
          <Spacer height={16} />
          <UIText kind="headline/h2" style={{ textAlign: 'center' }}>
            Signature Request
          </UIText>
          <UIText kind="small/regular" color="var(--neutral-500)">
            {originForHref ? (
              <TextAnchor
                href={originForHref.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {originForHref.hostname}
              </TextAnchor>
            ) : (
              'Unknown Initiator'
            )}
          </UIText>
          <Spacer height={8} />
          <HStack gap={8} alignItems="center">
            <WalletAvatar
              address={wallet.address}
              size={20}
              active={false}
              borderRadius={4}
            />
            <UIText kind="small/regular">
              <WalletDisplayName wallet={wallet} />
            </UIText>
          </HStack>
        </div>
        <Spacer height={24} />
        <MessageRow message={message} />
        <Spacer height={16} />
        <PhishingDefenceStatus origin={origin} />
      </PageColumn>
      <PageStickyFooter>
        <VStack
          style={{
            textAlign: 'center',
            marginTop: 'auto',
            paddingBottom: 24,
            paddingTop: 8,
          }}
          gap={8}
        >
          <UIText kind="caption/regular" color="var(--negative-500)">
            {personalSignMutation.isError
              ? getError(personalSignMutation.error).message
              : hardwareSignError
              ? 'Signing Error' // TODO: parse Ledger signing errors
              : null}
          </UIText>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 8,
            }}
          >
            <Button
              kind="regular"
              type="button"
              onClick={handleReject}
              ref={focusNode}
            >
              Cancel
            </Button>
            {isDeviceAccount(wallet) ? (
              <HardwareSignMessage
                derivationPath={wallet.derivationPath}
                getMessage={() => message}
                type="personalSign"
                isSigning={personalSignMutation.isLoading}
                onBeforeSign={() => setHardwareSignError(null)}
                onSignError={(error) => setHardwareSignError(error)}
                onSign={(signature) => {
                  try {
                    // TODO: add analytics via background script
                    handleSignSuccess(signature);
                  } catch (error) {
                    showErrorBoundary(error);
                  }
                }}
              />
            ) : (
              <Button
                disabled={personalSignMutation.isLoading}
                onClick={() => {
                  personalSignMutation.mutate({
                    params: [message],
                    initiator: origin,
                  });
                }}
              >
                {personalSignMutation.isLoading ? 'Signing...' : 'Sign'}
              </Button>
            )}
          </div>
        </VStack>
      </PageStickyFooter>
      <KeyboardShortcut combination="esc" onKeyDown={handleReject} />
    </Background>
  );
}

export function SignMessage() {
  const [params] = useSearchParams();
  const { data: wallet, isLoading } = useQuery({
    queryKey: ['wallet/uiGetCurrentWallet'],
    queryFn: () => walletPort.request('uiGetCurrentWallet'),
    useErrorBoundary: true,
  });
  if (isLoading || !wallet) {
    return null;
  }
  const origin = params.get('origin');
  if (!origin) {
    throw new Error('origin get-parameter is required for this view');
  }
  const message = params.get('message');
  if (!message) {
    throw new Error('message get-parameter is required for this view');
  }
  return (
    <SignMessageContent message={message} origin={origin} wallet={wallet} />
  );
}

import React, { useMemo } from 'react';
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
import type { BareWallet } from 'src/shared/types/BareWallet';
import { Background } from 'src/ui/components/Background';
import { PageStickyFooter } from 'src/ui/components/PageStickyFooter';
import { toUtf8String } from 'src/modules/ethereum/message-signing/toUtf8String';
import { getError } from 'src/shared/errors/getError';
import { invariant } from 'src/shared/invariant';
import { SiteFaviconImg } from 'src/ui/components/SiteFaviconImg';
import { TextAnchor } from 'src/ui/ui-kit/TextAnchor';
import { HStack } from 'src/ui/ui-kit/HStack';
import { WalletDisplayName } from 'src/ui/components/WalletDisplayName';
import { WalletAvatar } from 'src/ui/components/WalletAvatar';
import { KeyboardShortcut } from 'src/ui/components/KeyboardShortcut';
import {
  usePersonalSignMutation,
  useSignTypedData_v4Mutation,
} from 'src/ui/shared/requests/message-signing';
import { prepareForHref } from 'src/ui/shared/prepareForHref';

function ItemSurface({
  style,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const surfaceStyle = {
    ...style,
    padding: '10px 12px',
  };
  return <Surface style={surfaceStyle} {...props} />;
}

function MessageRow({ message }: { message: string }) {
  return (
    <VStack gap={8}>
      <UIText kind="body/regular" color="var(--neutral-500)">
        Data to Sign
      </UIText>
      <ItemSurface style={{ overflow: 'auto' }}>
        <UIText
          kind="body/regular"
          color="var(--neutral-700)"
          style={{ wordBreak: 'break-word' }}
        >
          {toUtf8String(message)}
        </UIText>
      </ItemSurface>
    </VStack>
  );
}

function TypedDataRow({ typedData }: { typedData: string }) {
  return (
    <VStack gap={8}>
      <UIText kind="body/regular" color="var(--neutral-500)">
        Data to Sign
      </UIText>
      <ItemSurface style={{ maxHeight: 160, overflow: 'auto' }}>
        <UIText
          kind="body/regular"
          color="var(--neutral-700)"
          style={{ fontFamily: 'monospace' }}
        >
          {typedData}
        </UIText>
      </ItemSurface>
    </VStack>
  );
}

function SignMessageContent({
  message,
  origin,
  typedData,
  wallet,
}: {
  message?: string;
  typedData?: string;
  origin: string;
  wallet: BareWallet;
}) {
  const [params] = useSearchParams();
  const windowId = params.get('windowId');
  invariant(windowId, 'windowId get-parameter is required');
  const handleSignSuccess = (signature: string) =>
    windowPort.confirm(windowId, signature);

  const signTypedData_v4Mutation = useSignTypedData_v4Mutation({
    onSuccess: handleSignSuccess,
  });
  const personalSignMutation = usePersonalSignMutation({
    onSuccess: handleSignSuccess,
  });
  const someMutationError = signTypedData_v4Mutation.isError
    ? getError(signTypedData_v4Mutation.error)
    : personalSignMutation.isError
    ? getError(personalSignMutation.error)
    : null;
  const originForHref = useMemo(() => prepareForHref(origin), [origin]);

  const handleReject = () => windowPort.reject(windowId);

  return (
    <Background backgroundKind="neutral">
      <PageColumn
        // different surface color on backgroundKind="neutral"
        style={{ ['--surface-background-color' as string]: 'var(--z-index-0)' }}
      >
        <PageTop />
        <div style={{ display: 'grid', placeItems: 'center' }}>
          <SiteFaviconImg size={44} url={origin} />
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
              borderRadius={2}
            />
            <UIText kind="small/regular">
              <WalletDisplayName wallet={wallet} />
            </UIText>
          </HStack>
        </div>
        <Spacer height={24} />
        <VStack gap={12}>
          {typedData ? (
            <TypedDataRow typedData={typedData} />
          ) : message ? (
            <MessageRow message={message} />
          ) : null}
        </VStack>
        <Spacer height={16} />
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
          {someMutationError ? (
            <UIText kind="caption/regular" color="var(--negative-500)">
              {someMutationError?.message}
            </UIText>
          ) : null}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 8,
            }}
          >
            <Button kind="regular" type="button" onClick={handleReject}>
              Cancel
            </Button>
            {typedData ? (
              <Button
                disabled={signTypedData_v4Mutation.isLoading}
                onClick={() => {
                  signTypedData_v4Mutation.mutate({
                    typedData,
                    initiator: origin,
                  });
                }}
              >
                {signTypedData_v4Mutation.isLoading ? 'Signing...' : 'Sign'}
              </Button>
            ) : message ? (
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
            ) : null}
          </div>
        </VStack>
      </PageStickyFooter>
      <KeyboardShortcut combination="esc" onKeyDown={handleReject} />
    </Background>
  );
}

export function SignMessage() {
  const [params] = useSearchParams();
  const {
    data: wallet,
    isLoading,
    isError,
  } = useQuery('wallet/uiGetCurrentWallet', () => {
    return walletPort.request('uiGetCurrentWallet');
  });
  if (isError) {
    return <p>Some Error</p>;
  }
  if (isLoading || !wallet) {
    return null;
  }
  const origin = params.get('origin');
  if (!origin) {
    throw new Error('origin get-parameter is required for this view');
  }
  const message = params.get('message');
  const typedData = params.get('typedData');
  if (message == null && typedData == null) {
    throw new Error(
      'Either "message" or "typedData" get-parameter is required for this view'
    );
  }
  return (
    <SignMessageContent
      message={message ?? undefined}
      typedData={typedData ?? undefined}
      origin={origin}
      wallet={wallet}
    />
  );
}

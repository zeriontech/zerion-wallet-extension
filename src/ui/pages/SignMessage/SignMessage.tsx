import React, { useMemo } from 'react';
import { useMutation, useQuery } from 'react-query';
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
import { TypedData } from 'src/modules/ethereum/message-signing/TypedData';
import { toUtf8String } from 'src/modules/ethereum/message-signing/toUtf8String';
import { getError } from 'src/shared/errors/getError';
import { invariant } from 'src/shared/invariant';
import { SiteFaviconImg } from 'src/ui/components/SiteFaviconImg';
import { TextAnchor } from 'src/ui/ui-kit/TextAnchor';
import { HStack } from 'src/ui/ui-kit/HStack';
import { WalletDisplayName } from 'src/ui/components/WalletDisplayName';
import { WalletAvatar } from 'src/ui/components/WalletAvatar';

function ItemSurface({ style, ...props }: React.HTMLProps<HTMLDivElement>) {
  const surfaceStyle = {
    ...style,
    padding: '10px 12px',
  };
  return <Surface style={surfaceStyle} {...props} />;
}

function MessageRow({ message }: { message: string }) {
  return (
    <VStack gap={8}>
      <UIText kind="body/s_reg" color="var(--neutral-500)">
        Data to Sign
      </UIText>
      <ItemSurface>
        <UIText kind="body/s_reg" color="var(--neutral-700)">
          {toUtf8String(message)}
        </UIText>
      </ItemSurface>
    </VStack>
  );
}

function TypedDataRow({ typedData }: { typedData: string }) {
  return (
    <VStack gap={8}>
      <UIText kind="body/s_reg" color="var(--neutral-500)">
        Data to Sign
      </UIText>
      <ItemSurface style={{ maxHeight: 160, overflow: 'auto' }}>
        <UIText
          kind="body/s_reg"
          color="var(--neutral-700)"
          style={{ fontFamily: 'monospace' }}
        >
          {typedData}
        </UIText>
      </ItemSurface>
    </VStack>
  );
}

type SignMutationProps = { onSuccess: (value: string) => void };

function useSignTypedData_v4Mutation({ onSuccess }: SignMutationProps) {
  return useMutation(
    async ({ typedData }: { typedData: TypedData | string }) => {
      return await walletPort.request('signTypedData_v4', {
        typedData,
      });
    },
    { onSuccess }
  );
}

function usePersonalSignMutation({ onSuccess }: SignMutationProps) {
  return useMutation(
    async ([message]: [string]) => {
      return await walletPort.request('personalSign', [message]);
    },
    { onSuccess }
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
  const hostname = useMemo(() => new URL(origin).hostname, [origin]);

  return (
    <Background backgroundKind="neutral">
      <PageColumn>
        <PageTop />
        <div style={{ display: 'grid', placeItems: 'center' }}>
          <SiteFaviconImg style={{ width: 44, height: 44 }} url={origin} />
          <Spacer height={16} />
          <UIText kind="headline/h2" style={{ textAlign: 'center' }}>
            Signature Request
          </UIText>
          <UIText kind="subtitle/m_reg" color="var(--neutral-500)">
            <TextAnchor href={origin} target="_blank" rel="noopener noreferrer">
              {hostname}
            </TextAnchor>
          </UIText>
          <Spacer height={8} />

          <HStack gap={8} alignItems="center">
            <WalletAvatar
              address={wallet.address}
              size={20}
              active={false}
              borderRadius="2px"
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
            <UIText kind="caption/reg" color="var(--negative-500)">
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
            <Button
              kind="regular"
              type="button"
              onClick={() => {
                windowPort.reject(windowId);
              }}
            >
              Cancel
            </Button>
            {typedData ? (
              <Button
                disabled={signTypedData_v4Mutation.isLoading}
                onClick={() => {
                  signTypedData_v4Mutation.mutate({ typedData });
                }}
              >
                {signTypedData_v4Mutation.isLoading ? 'Signing...' : 'Sign'}
              </Button>
            ) : message ? (
              <Button
                disabled={personalSignMutation.isLoading}
                onClick={() => {
                  personalSignMutation.mutate([message]);
                }}
              >
                {personalSignMutation.isLoading ? 'Signing...' : 'Sign'}
              </Button>
            ) : null}
          </div>
        </VStack>
      </PageStickyFooter>
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

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
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { Surface } from 'src/ui/ui-kit/Surface';
import { BlockieImg } from 'src/ui/components/BlockieImg';
import { Media } from 'src/ui/ui-kit/Media';
import { truncateAddress } from 'src/ui/shared/truncateAddress';
import ZerionSquircle from 'src/ui/assets/zerion-squircle.svg';
import type { BareWallet } from 'src/shared/types/BareWallet';
import { Background } from 'src/ui/components/Background';
import { PageStickyFooter } from 'src/ui/components/PageStickyFooter';
import { TypedData } from 'src/modules/ethereum/message-signing/TypedData';
import { toUtf8String } from 'src/modules/ethereum/message-signing/toUtf8String';

function ItemSurface({ style, ...props }: React.HTMLProps<HTMLDivElement>) {
  const surfaceStyle = {
    ...style,
    padding: '10px 12px',
    backgroundColor: 'var(--neutral-100)',
  };
  return <Surface style={surfaceStyle} {...props} />;
}

function WalletLine({ address, label }: { address: string; label: string }) {
  return (
    <ItemSurface>
      <Media
        vGap={0}
        image={<BlockieImg address={address} size={32} />}
        text={
          <UIText kind="caption/reg" color="var(--neutral-500)">
            {label}
          </UIText>
        }
        detailText={
          <UIText kind="subtitle/l_reg">{truncateAddress(address, 4)}</UIText>
        }
      />
    </ItemSurface>
  );
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

function isErrorMessageObject(value: unknown): value is { message: string } {
  return Boolean(value && 'message' in (value as { message?: string }));
}

function getError(value: Error | unknown): Error {
  return value instanceof Error
    ? value
    : isErrorMessageObject(value)
    ? new Error(value.message)
    : new Error('Unknown Error');
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

  const handleSignSuccess = (signature: string) =>
    windowPort.confirm(Number(params.get('windowId')), signature);

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
  console.log({ someMutationError }, signTypedData_v4Mutation.error);
  const originName = useMemo(() => new URL(origin).hostname, [origin]);

  return (
    <Background backgroundKind="white">
      <PageColumn>
        <PageTop />
        <div style={{ display: 'grid', placeItems: 'center' }}>
          <ZerionSquircle style={{ width: 44, height: 44 }} />
          <Spacer height={16} />
          <UIText kind="h/5_med" style={{ textAlign: 'center' }}>
            Signature Request
          </UIText>
          <Spacer height={8} />
          <UIText kind="subtitle/m_reg" color="var(--primary)">
            {originName}
          </UIText>
        </div>
        <Spacer height={24} />
        <Spacer height={16} />
        <VStack gap={12}>
          <WalletLine address={wallet.address} label="Wallet" />
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
          {typedData ? (
            <Button
              onClick={() => {
                signTypedData_v4Mutation.mutate({ typedData });
              }}
            >
              {signTypedData_v4Mutation.isLoading ? 'Signing...' : 'Sign'}
            </Button>
          ) : message ? (
            <Button
              onClick={() => {
                personalSignMutation.mutate([message]);
              }}
            >
              {personalSignMutation.isLoading ? 'Signing...' : 'Sign'}
            </Button>
          ) : null}
          <UnstyledButton
            type="button"
            style={{ color: 'var(--primary)' }}
            onClick={() => {
              windowPort.reject(Number(params.get('windowId')));
            }}
          >
            Reject
          </UnstyledButton>
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
  } = useQuery('wallet', () => {
    return walletPort.request('getCurrentWallet');
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

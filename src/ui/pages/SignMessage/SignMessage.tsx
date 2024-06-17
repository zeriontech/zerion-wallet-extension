import React, { useMemo, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
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
import { invariant } from 'src/shared/invariant';
import { TextAnchor } from 'src/ui/ui-kit/TextAnchor';
import { HStack } from 'src/ui/ui-kit/HStack';
import { WalletDisplayName } from 'src/ui/components/WalletDisplayName';
import { WalletAvatar } from 'src/ui/components/WalletAvatar';
import { prepareForHref } from 'src/ui/shared/prepareForHref';
import { focusNode } from 'src/ui/shared/focusNode';
import { PhishingDefenceStatus } from 'src/ui/components/PhishingDefence/PhishingDefenceStatus';
import type { ExternallyOwnedAccount } from 'src/shared/types/ExternallyOwnedAccount';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { INTERNAL_ORIGIN } from 'src/background/constants';
import type { SignMsgBtnHandle } from 'src/ui/components/SignMessageButton';
import { SignMessageButton } from 'src/ui/components/SignMessageButton';
import { txErrorToMessage } from '../SendTransaction/shared/transactionErrorToMessage';

function MessageRow({ message }: { message: string }) {
  return (
    <VStack gap={8}>
      <UIText kind="body/regular" color="var(--neutral-500)">
        Data to Sign
      </UIText>
      <Surface padding={16} style={{ border: '1px solid var(--neutral-300)' }}>
        <UIText
          kind="small/regular"
          style={{ whiteSpace: 'pre-wrap', overflowWrap: 'break-word' }}
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
  clientScope: clientScopeParam,
  wallet,
}: {
  message: string;
  origin: string;
  clientScope: string | null;
  wallet: ExternallyOwnedAccount;
}) {
  const [params] = useSearchParams();
  const windowId = params.get('windowId');
  invariant(windowId, 'windowId get-parameter is required');
  const handleSignSuccess = (signature: string) =>
    windowPort.confirm(windowId, signature);

  const clientScope = clientScopeParam || 'External Dapp';

  const signMsgBtnRef = useRef<SignMsgBtnHandle | null>(null);

  const { mutate: personalSign, ...personalSignMutation } = useMutation({
    mutationFn: async () => {
      invariant(signMsgBtnRef.current, 'SignMessageButton not found');
      return signMsgBtnRef.current.personalSign({
        params: [message],
        initiator: origin,
        clientScope,
      });
    },
    // The value returned by onMutate can be accessed in
    // a global onError handler (src/ui/shared/requests/queryClient.ts)
    // TODO: refactor to just emit error directly from the mutationFn
    onMutate: () => 'signMessage',
    onSuccess: handleSignSuccess,
  });

  const originForHref = useMemo(() => prepareForHref(origin), [origin]);

  const handleReject = () => windowPort.reject(windowId);

  return (
    <Background backgroundKind="white">
      <NavigationTitle title={null} documentTitle="Sign Message" />
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
            {origin === INTERNAL_ORIGIN ? (
              'Zerion'
            ) : originForHref ? (
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
        <PhishingDefenceStatus origin={origin} type="dapp" />
      </PageColumn>
      <PageStickyFooter>
        <Spacer height={16} />
        <VStack
          style={{
            textAlign: 'center',
            marginTop: 'auto',
            paddingBottom: 24,
            paddingTop: 8,
          }}
          gap={8}
        >
          {personalSignMutation.isError ? (
            <UIText kind="caption/regular" color="var(--negative-500)">
              {txErrorToMessage(personalSignMutation.error)}
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
              onClick={handleReject}
              ref={focusNode}
            >
              Cancel
            </Button>
            <SignMessageButton
              ref={signMsgBtnRef}
              wallet={wallet}
              onClick={() => personalSign()}
            />
          </div>
        </VStack>
      </PageStickyFooter>
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
  const clientScope = params.get('clientScope');
  const origin = params.get('origin');
  const message = params.get('message');
  invariant(origin, 'origin get-parameter is required for this view');
  invariant(message, 'message get-parameter is required for this view');
  return (
    <SignMessageContent
      message={message}
      origin={origin}
      clientScope={clientScope}
      wallet={wallet}
    />
  );
}

import React, { useMemo } from 'react';
import { useMutation, useQuery } from 'react-query';
import { Route, Routes, useNavigate, useSearchParams } from 'react-router-dom';
import { invariant } from 'src/shared/invariant';
import { BareWallet } from 'src/shared/types/BareWallet';
import { Background } from 'src/ui/components/Background';
import { Badge } from 'src/ui/components/Badge';
import { KeyboardShortcut } from 'src/ui/components/KeyboardShortcut';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { SiteFaviconImg } from 'src/ui/components/SiteFaviconImg';
import { walletPort, windowPort } from 'src/ui/shared/channels';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import SignInIcon from 'jsx:src/ui/assets/sign-in.svg';
import { WalletAvatar } from 'src/ui/components/WalletAvatar';
import { WalletDisplayName } from 'src/ui/components/WalletDisplayName';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import { Address } from 'src/ui/components/Address';
import { Button } from 'src/ui/ui-kit/Button';
import { focusNode } from 'src/ui/shared/focusNode';
import { SiweMessage } from 'src/modules/ethereum/message-signing/SIWE';
import { toUtf8String } from 'ethers/lib/utils';
import { DataToSign } from './DataToSign';
import { DataVerificationFailed } from './DataVerificationFailed';
import { ConfirmWithPassword } from './ConfirmWithPassword';
import { SpeechBubble } from './SpeechBubble/SpeechBubble';

type SignMutationProps = { onSuccess: (value: string) => void };

function usePersonalSignMutation({ onSuccess }: SignMutationProps) {
  return useMutation(
    async (params: { params: [string]; initiator: string }) => {
      return await walletPort.request('personalSign', params);
    },
    {
      // onMutate creates a context that we can use in global onError handler
      // to know more about a mutation (in react-query@v4 you should use "context" instead)
      onMutate: () => 'signMessage',
      onSuccess,
    }
  );
}

function SignInView({
  origin,
  wallet,
  windowId,
  siweMessage,
}: {
  origin: string;
  wallet: BareWallet;
  windowId: string;
  siweMessage: SiweMessage;
}) {
  const navigate = useNavigate();

  const handleSignSuccess = (signature: string) =>
    windowPort.confirm(windowId, signature);
  const handleReject = () => windowPort.reject(windowId);

  const personalSignMutation = usePersonalSignMutation({
    onSuccess: handleSignSuccess,
  });

  return (
    <Background backgroundKind="white">
      <PageTop />
      <PageColumn
        style={{ ['--surface-background-color' as string]: 'var(--z-index-0)' }}
      >
        <Badge icon={<SignInIcon />} text="Signing In" />
        <Spacer height={16} />
        <VStack gap={8}>
          <UIText kind="small/accent" color="var(--neutral-500)">
            To application
          </UIText>
          <HStack gap={8} alignItems="center">
            <SiteFaviconImg
              style={{
                width: 32,
                height: 32,
                borderRadius: 6,
              }}
              url={origin}
              alt={`Logo for ${origin}`}
            />
            <UIText kind="headline/h2">{new URL(origin).hostname}</UIText>
          </HStack>
        </VStack>
        <Spacer height={16} />
        {siweMessage.statement && (
          <>
            <SpeechBubble text={siweMessage.statement} />
            <Spacer height={16} />
          </>
        )}
        <VStack gap={8}>
          <UIText kind="small/accent" color="var(--neutral-500)">
            With wallet
          </UIText>
          <HStack gap={8} alignItems="center" justifyContent="space-between">
            <HStack gap={8} alignItems="center">
              <WalletAvatar
                address={wallet.address}
                size={32}
                borderRadius={6}
              />
              <UIText kind="headline/h2">
                <WalletDisplayName wallet={wallet} />
              </UIText>
            </HStack>
          </HStack>
          <Address address={normalizeAddress(wallet.address)} />
        </VStack>
        <Spacer height={16} />
        <Button
          kind="neutral"
          onClick={() =>
            navigate(`/siwe/data?message=${siweMessage.rawMessage}`)
          }
        >
          Advanced View
        </Button>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
            marginTop: 'auto',
            paddingBottom: 32,
          }}
        >
          <Button type="button" kind="regular" onClick={handleReject}>
            Cancel
          </Button>
          <Button
            ref={focusNode}
            disabled={personalSignMutation.isLoading}
            onClick={() => {
              personalSignMutation.mutate({
                params: [siweMessage.rawMessage],
                initiator: origin,
              });
            }}
          >
            {personalSignMutation.isLoading ? 'Signing In...' : 'Sign In'}
          </Button>
        </div>
      </PageColumn>
      <KeyboardShortcut combination="esc" onKeyDown={handleReject} />
    </Background>
  );
}

export function SignIn() {
  const [params] = useSearchParams();
  const origin = params.get('origin');
  const windowId = params.get('windowId');
  const message = params.get('message');

  invariant(origin, 'origin get-parameter is required');
  invariant(windowId, 'windowId get-parameter is required');
  invariant(message, 'message get-parameter is required');

  const siweMessage = useMemo(
    () => SiweMessage.parse(toUtf8String(message)),
    [message]
  );

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

  return (
    <SignInView
      wallet={wallet}
      origin={origin}
      windowId={windowId}
      siweMessage={siweMessage}
    />
  );
}

export function SignInWithEthereum() {
  return (
    <Routes>
      <Route path="/" element={<SignIn />} />
      <Route path="/data" element={<DataToSign />} />
      <Route path="/verification-failed" element={<DataVerificationFailed />} />
      <Route path="/confirm" element={<ConfirmWithPassword />} />
    </Routes>
  );
}

import React, { useMemo } from 'react';
import { useQuery } from 'react-query';
import { useSearchParams } from 'react-router-dom';
import { invariant } from 'src/shared/invariant';
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
import { WalletAvatar } from 'src/ui/components/WalletAvatar';
import { WalletDisplayName } from 'src/ui/components/WalletDisplayName';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import { Address } from 'src/ui/components/Address';
import { Button } from 'src/ui/ui-kit/Button';
import { focusNode } from 'src/ui/shared/focusNode';
import { SiweMessage } from 'src/modules/ethereum/message-signing/SIWE';
import { toUtf8String } from 'src/modules/ethereum/message-signing/toUtf8String';
import SignInIcon from 'jsx:src/ui/assets/sign-in.svg';
import { FillView } from 'src/ui/components/FillView';
import { VerifyUser } from 'src/ui/components/VerifyUser';
import { Surface } from 'src/ui/ui-kit/Surface';
import { usePersonalSignMutation } from 'src/ui/shared/requests/message-signing';
import { SpeechBubble } from './SpeechBubble/SpeechBubble';
import { useFetchUTCTime } from './useFetchUTCTime';
import { SiweError } from './SiweError';
import { DataVerificationFailed } from './DataVerificationFailed';
import { NavigationBar } from './NavigationBar';

export function SignInWithEthereum() {
  const [params, setSearchParams] = useSearchParams();
  const updateSearchParam = (
    key: string,
    value: string,
    navigateOptions?: Parameters<typeof setSearchParams>[1]
  ) => {
    const newParams = new URLSearchParams(params);
    newParams.set(key, value);
    setSearchParams(newParams, navigateOptions);
  };

  const origin = params.get('origin');
  const windowId = params.get('windowId');
  const message = params.get('message');

  invariant(origin, 'origin get-parameter is required');
  invariant(windowId, 'windowId get-parameter is required');
  invariant(message, 'message get-parameter is required');

  const {
    data: wallet,
    isLoading,
    isError,
  } = useQuery('wallet/uiGetCurrentWallet', () => {
    return walletPort.request('uiGetCurrentWallet');
  });

  const { data: utcTime, isLoading: utcTimeLoading } = useFetchUTCTime();
  const currentTime =
    utcTimeLoading || !utcTime ? new Date().getTime() : utcTime;

  const messageUtf8 = useMemo(() => toUtf8String(message), [message]);
  const siweMessage = useMemo(() => {
    const siwe = SiweMessage.parse(messageUtf8);
    if (siwe && wallet) {
      siwe.validate(new URL(origin), wallet.address, currentTime);
    }
    return siwe;
  }, [messageUtf8, wallet, origin, currentTime]);

  const handleSignSuccess = (signature: string) =>
    windowPort.confirm(windowId, signature);
  const personalSignMutation = usePersonalSignMutation({
    onSuccess: handleSignSuccess,
  });
  const handleSignIn = () => {
    personalSignMutation.mutate({
      params: [siweMessage?.rawMessage || ''],
      initiator: origin,
    });
  };
  const handleReject = () => windowPort.reject(windowId);

  if (isError) {
    return <p>Some Error</p>;
  }
  if (isLoading || !wallet) {
    return null;
  }

  return (
    <Background backgroundKind="white">
      <PageColumn>
        <>
          {params.has('step') === false ? (
            <>
              <PageTop />
              <Badge
                icon={<SignInIcon style={{ color: 'var(--neutral-500)' }} />}
                text="Signing In"
              />
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
              {siweMessage?.statement && (
                <>
                  <SpeechBubble text={siweMessage.statement} />
                  <Spacer height={16} />
                </>
              )}
              <VStack gap={8}>
                <UIText kind="small/accent" color="var(--neutral-500)">
                  With wallet
                </UIText>
                <HStack
                  gap={8}
                  alignItems="center"
                  justifyContent="space-between"
                >
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
                <Address
                  address={normalizeAddress(wallet.address)}
                  infixColor="var(--neutral-500)"
                />
              </VStack>
              <Spacer height={16} />
              <Button
                kind="neutral"
                onClick={() => updateSearchParam('step', 'data')}
              >
                Advanced View
              </Button>
              <Spacer height={16} />
              <SiweError
                siwe={siweMessage}
                onReadMore={() => updateSearchParam('step', 'errors')}
              />
            </>
          ) : null}
          {params.get('step') === 'data' ? (
            <>
              <NavigationBar title="Data to Sign" />
              <PageTop />
              <Surface
                padding={16}
                style={{ border: '1px solid var(--neutral-300)' }}
              >
                <UIText kind="small/regular" style={{ whiteSpace: 'pre-wrap' }}>
                  {messageUtf8}
                </UIText>
              </Surface>
            </>
          ) : null}
          {params.get('step') === 'errors' && siweMessage ? (
            <DataVerificationFailed siwe={siweMessage} />
          ) : null}
          {params.get('step') === 'verifyUser' ? (
            <>
              <NavigationBar title="Confirm With Password" />
              <FillView adjustForNavigationBar={true}>
                <VerifyUser
                  style={{ alignItems: 'center' }}
                  text="Verification is required in order to ignore the warning and proceed further"
                  onSuccess={handleSignIn}
                />
              </FillView>
            </>
          ) : null}
        </>
        <Spacer height={16} />
        {params.has('step') === false || params.get('step') === 'data' ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: !siweMessage?.isValid() ? 'none' : '1fr 1fr',
              gap: 8,
              marginTop: 'auto',
              paddingBottom: 32,
            }}
          >
            {!siweMessage?.isValid() ? (
              <>
                <Button ref={focusNode} onClick={handleReject}>
                  Close
                </Button>
                <Button
                  kind="ghost"
                  onClick={() => updateSearchParam('step', 'verifyUser')}
                >
                  <UIText kind="caption/accent" color="var(--neutral-500)">
                    Proceed anyway
                  </UIText>
                </Button>
              </>
            ) : (
              <>
                <Button type="button" kind="regular" onClick={handleReject}>
                  Cancel
                </Button>
                <Button
                  ref={focusNode}
                  disabled={personalSignMutation.isLoading}
                  onClick={handleSignIn}
                >
                  {personalSignMutation.isLoading ? 'Signing In...' : 'Sign In'}
                </Button>
              </>
            )}
          </div>
        ) : null}
      </PageColumn>
      <KeyboardShortcut combination="esc" onKeyDown={handleReject} />
    </Background>
  );
}

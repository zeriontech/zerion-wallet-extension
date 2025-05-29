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
import { useBackgroundKind } from 'src/ui/components/Background';
import { PageStickyFooter } from 'src/ui/components/PageStickyFooter';
import { toUtf8String } from 'src/modules/ethereum/message-signing/toUtf8String';
import { invariant } from 'src/shared/invariant';
import { HStack } from 'src/ui/ui-kit/HStack';
import { WalletDisplayName } from 'src/ui/components/WalletDisplayName';
import { WalletAvatar } from 'src/ui/components/WalletAvatar';
import { focusNode } from 'src/ui/shared/focusNode';
import type { ExternallyOwnedAccount } from 'src/shared/types/ExternallyOwnedAccount';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import type { SignMsgBtnHandle } from 'src/ui/components/SignMessageButton';
import { SignMessageButton } from 'src/ui/components/SignMessageButton';
import { usePreferences } from 'src/ui/features/preferences';
import { wait } from 'src/shared/wait';
import { isSolanaAddress } from 'src/modules/solana/shared';
import { ethers } from 'ethers';
import { whiteBackgroundKind } from 'src/ui/components/Background/Background';
import { SiteFaviconImg } from 'src/ui/components/SiteFaviconImg';
import { usePhishingDefenceStatus } from 'src/ui/components/PhishingDefence/usePhishingDefenceStatus';
import { SecurityCheck } from 'src/ui/shared/security-check/DappSecurityCheck';
import SignatureIcon from 'jsx:src/ui/assets/signature.svg';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import ArrowDownIcon from 'jsx:src/ui/assets/caret-down-filled.svg';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { BottomSheetDialog } from 'src/ui/ui-kit/ModalDialogs/BottomSheetDialog';
import { DialogButtonValue } from 'src/ui/ui-kit/ModalDialogs/DialogTitle';
import CopyIcon from 'jsx:src/ui/assets/copy.svg';
import { useCopyToClipboard } from 'src/ui/shared/useCopyToClipboard';
import { prepareForHref } from 'src/ui/shared/prepareForHref';
import { TextAnchor } from 'src/ui/ui-kit/TextAnchor';
import { txErrorToMessage } from '../SendTransaction/shared/transactionErrorToMessage';
import type { PopoverToastHandle } from '../Settings/PopoverToast';
import { PopoverToast } from '../Settings/PopoverToast';

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
  useBackgroundKind(whiteBackgroundKind);
  const dialogRef = useRef<HTMLDialogElementInterface | null>(null);
  const toastRef = useRef<PopoverToastHandle>(null);
  const [params] = useSearchParams();
  const windowId = params.get('windowId');
  const { preferences } = usePreferences();
  invariant(windowId, 'windowId get-parameter is required');
  const handleSignSuccess = (signature: string) =>
    windowPort.confirm(windowId, signature);

  const clientScope = clientScopeParam || 'External Dapp';

  const signMsgBtnRef = useRef<SignMsgBtnHandle | null>(null);
  const securityQuery = usePhishingDefenceStatus(origin);

  const { mutate: confirmRequest, ...confirmMutation } = useMutation({
    mutationFn: async () => {
      invariant(signMsgBtnRef.current, 'SignMessageButton not found');
      if (isSolanaAddress(wallet.address)) {
        invariant(
          ethers.isHexString(message),
          'Solana message is expected to be serialized to hex string'
        );
        return signMsgBtnRef.current.signMessage({
          messageHex: message,
          initiator: origin,
          clientScope,
        });
      } else {
        return signMsgBtnRef.current.personalSign({
          params: [message],
          initiator: origin,
          clientScope,
        });
      }
    },
    // The value returned by onMutate can be accessed in
    // a global onError handler (src/ui/shared/requests/queryClient.ts)
    // TODO: refactor to just emit error directly from the mutationFn
    onMutate: () => 'signMessage',
    onSuccess: async (signature) => {
      if (preferences?.enableHoldToSignButton) {
        // small delay to show success state to the user before closing the popup
        await wait(500);
      }
      handleSignSuccess(signature);
    },
  });

  const originForHref = useMemo(() => prepareForHref(origin), [origin]);

  const handleReject = () => windowPort.reject(windowId);
  const messageText = toUtf8String(message);

  const { handleCopy } = useCopyToClipboard({
    text: messageText,
    onSuccess: () => toastRef.current?.showToast(),
  });

  return (
    <>
      <PopoverToast
        ref={toastRef}
        style={{
          bottom: 'calc(100px + var(--technical-panel-bottom-height, 0px))',
        }}
      >
        Copied to Clipboard
      </PopoverToast>
      <BottomSheetDialog ref={dialogRef} height="fit-content">
        <VStack gap={24}>
          <VStack
            gap={0}
            style={{
              backgroundColor: 'var(--neutral-100)',
              borderRadius: 12,
              padding: '12px 16px',
            }}
          >
            <UIText kind="small/regular" color="var(--neutral-600)">
              Message
            </UIText>
            <UIText
              kind="body/regular"
              style={{ maxHeight: '80vh', overflowY: 'auto' }}
            >
              {messageText}
            </UIText>
          </VStack>
          <form method="dialog" onSubmit={(event) => event.stopPropagation()}>
            <Button
              value={DialogButtonValue.cancel}
              kind="primary"
              style={{ width: '100%' }}
              onClick={handleCopy}
            >
              <HStack gap={8} alignItems="center" justifyContent="center">
                <span>Copy Message</span>
                <CopyIcon />
              </HStack>
            </Button>
          </form>
        </VStack>
      </BottomSheetDialog>
      <NavigationTitle title={null} documentTitle="Sign Message" />
      <PageTop />
      <PageColumn>
        <VStack gap={8}>
          <VStack
            gap={8}
            style={{
              justifyItems: 'center',
              paddingBlock: 24,
              border: '1px solid var(--neutral-300)',
              backgroundColor: '#ffffff40', // todo: use theme color
              backdropFilter: 'blur(16px)',
              borderRadius: 12,
            }}
          >
            <SiteFaviconImg
              size={64}
              style={{ borderRadius: 16 }}
              url={origin}
              alt={`Logo for ${origin}`}
            />
            <UIText kind="headline/h2">Sign Message</UIText>
            <UIText kind="small/accent" color="var(--neutral-500)">
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
            <HStack gap={8} alignItems="center">
              <WalletAvatar
                address={wallet.address}
                size={20}
                active={false}
                borderRadius={6}
              />
              <UIText kind="small/regular">
                <WalletDisplayName wallet={wallet} />
              </UIText>
            </HStack>
          </VStack>
          <UnstyledButton
            onClick={() => dialogRef.current?.showModal()}
            className="parent-hover"
            style={{
              textAlign: 'start',
              padding: '12px 12px 0',
              backgroundColor: 'var(--neutral-100)',
              borderRadius: 12,
              ['--parent-content-color' as string]: 'var(--neutral-500)',
              ['--parent-hovered-content-color' as string]: 'var(--black)',
            }}
          >
            <HStack gap={16} justifyContent="space-between">
              <HStack gap={8}>
                <SignatureIcon />
                <VStack gap={0} style={{ position: 'relative' }}>
                  <UIText kind="small/regular" color="var(--neutral-600)">
                    Message
                  </UIText>
                  <UIText
                    kind="body/accent"
                    style={{
                      position: 'relative',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      minHeight: 48,
                    }}
                  >
                    {messageText}
                  </UIText>
                  <div
                    style={{
                      position: 'absolute',
                      inset: '0 0 0 0',
                      pointerEvents: 'none',
                      background:
                        'linear-gradient(180deg, transparent 50%, var(--neutral-100) 100%)',
                    }}
                  />
                </VStack>
              </HStack>
              <ArrowDownIcon
                className="content-hover"
                style={{ width: 24, height: 24, alignSelf: 'center' }}
              />
            </HStack>
          </UnstyledButton>
          <SecurityCheck
            status={securityQuery.data?.status}
            isLoading={securityQuery.isLoading}
          />
        </VStack>
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
          {confirmMutation.isError ? (
            <UIText kind="caption/regular" color="var(--negative-500)">
              {txErrorToMessage(confirmMutation.error)}
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
            {preferences ? (
              <SignMessageButton
                ref={signMsgBtnRef}
                wallet={wallet}
                onClick={() => confirmRequest()}
                disabled={confirmMutation.isLoading}
                holdToSign={preferences.enableHoldToSignButton}
              />
            ) : null}
          </div>
        </VStack>
      </PageStickyFooter>
    </>
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

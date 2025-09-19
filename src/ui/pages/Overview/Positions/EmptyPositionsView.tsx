import React, { useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import ArrowCircleIcon from 'jsx:src/ui/assets/arrow-circle-outlined.svg';
import IdentityIcon from 'jsx:src/ui/assets/identity.svg';
import QrCodeIcon from 'jsx:src/ui/assets/qr-code.svg';
import { useNavigate } from 'react-router-dom';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import { getAddressType } from 'src/shared/wallet/classifiers';
import { EmptyView } from 'src/ui/components/EmptyView';
import { usePreferences } from 'src/ui/features/preferences';
import { walletPort } from 'src/ui/shared/channels';
import { setCurrentAddress } from 'src/ui/shared/requests/setCurrentAddress';
import { useWalletParams } from 'src/ui/shared/requests/useWalletParams';
import { Button } from 'src/ui/ui-kit/Button';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { HStack } from 'src/ui/ui-kit/HStack';
import { BottomSheetDialog } from 'src/ui/ui-kit/ModalDialogs/BottomSheetDialog';
import { DialogTitle } from 'src/ui/ui-kit/ModalDialogs/DialogTitle';
import { type HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { Media } from 'src/ui/ui-kit/Media';
import {
  FrameListItemAnchor,
  FrameListItemLink,
} from 'src/ui/ui-kit/FrameList';

const ZERION_ORIGIN = 'https://app.zerion.io';

function AddFundsOptionsDialog({
  address,
  buyCryptoHref,
  dialogRef,
}: {
  address: string;
  buyCryptoHref: string;
  dialogRef: React.RefObject<HTMLDialogElementInterface>;
}) {
  return (
    <BottomSheetDialog
      ref={dialogRef}
      height="min-content"
      renderWhenOpen={() => (
        <VStack gap={24}>
          <DialogTitle title={<UIText kind="headline/h3">Add Funds</UIText>} />
          <VStack gap={8}>
            <FrameListItemAnchor
              style={{ border: '2px solid var(--neutral-100)' }}
              href={buyCryptoHref}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Media
                image={
                  <div
                    style={{
                      backgroundColor: 'var(--positive-500)',
                      padding: 8,
                      color: 'var(--white)',
                      borderRadius: 12,
                    }}
                  >
                    <IdentityIcon
                      style={{ width: 24, height: 24, display: 'block' }}
                    />
                  </div>
                }
                gap={12}
                text={<UIText kind="body/accent">Buy Crypto</UIText>}
                vGap={4}
                alignItems="start"
                detailText={
                  <UIText kind="body/accent" color="var(--neutral-500)">
                    Use Apple Pay, credit/debit card, or bank transfer to buy
                    crypto
                  </UIText>
                }
              />
            </FrameListItemAnchor>
            <FrameListItemLink
              style={{ border: '2px solid var(--neutral-100)' }}
              to={`/receive?address=${address}`}
            >
              <Media
                image={
                  <div
                    style={{
                      backgroundColor: 'var(--primary-500)',
                      padding: 8,
                      color: 'var(--white)',
                      borderRadius: 12,
                    }}
                  >
                    <QrCodeIcon
                      style={{ width: 24, height: 24, display: 'block' }}
                    />
                  </div>
                }
                gap={12}
                text={<UIText kind="body/accent">Receive Crypto</UIText>}
                vGap={4}
                alignItems="start"
                detailText={
                  <UIText kind="body/accent" color="var(--neutral-500)">
                    Transfer crypto from another wallet or exchange with QR code
                    or wallet address
                  </UIText>
                }
              />
            </FrameListItemLink>
          </VStack>
        </VStack>
      )}
    />
  );
}

export function EmptyPositionsView() {
  const { data: wallet } = useQuery({
    queryKey: ['wallet/uiGetCurrentWallet'],
    queryFn: () => {
      return walletPort.request('uiGetCurrentWallet');
    },
  });

  const { data: walletGroups, isLoading } = useQuery({
    queryKey: ['wallet/uiGetWalletGroups'],
    queryFn: () => walletPort.request('uiGetWalletGroups'),
    useErrorBoundary: true,
    suspense: false,
  });

  const { preferences } = usePreferences();
  const addWalletParams = useWalletParams(wallet);
  const navigate = useNavigate();
  const dialogRef = useRef<HTMLDialogElementInterface>(null);

  const isTestnetMode = preferences?.testnetMode?.on;

  const goToBridgeMutation = useMutation({
    mutationFn: async () => {
      const solanaAddress = wallet?.address;
      let ethereumAddress: string | null = null;
      if (walletGroups) {
        for (const group of walletGroups) {
          for (const wallet of group.walletContainer.wallets) {
            const address = normalizeAddress(wallet.address);
            if (getAddressType(address) === 'evm') {
              ethereumAddress = address;
              break;
            }
          }
        }
      }
      if (ethereumAddress) {
        await setCurrentAddress({ address: ethereumAddress });
      }
      return { ethereumAddress, solanaAddress };
    },
    onSuccess: ({ ethereumAddress, solanaAddress }) => {
      if (!ethereumAddress || !solanaAddress) {
        navigate('/bridge-form');
      } else {
        const params = new URLSearchParams({
          outputChain: 'solana',
          showReceiverAddressInput: 'on',
          receiverAddressInput: solanaAddress,
          to: solanaAddress,
        });
        navigate(`/bridge-form?${params.toString()}`);
      }
    },
  });

  if (isTestnetMode || !wallet || goToBridgeMutation.isLoading || isLoading) {
    return <EmptyView>No assets yet</EmptyView>;
  }

  const buyCryptoHref = `${ZERION_ORIGIN}/deposit?${addWalletParams}`;

  return (
    <>
      <VStack
        gap={16}
        style={{
          justifyItems: 'stretch',
          paddingInline: 16,
          textAlign: 'center',
          marginTop: 32,
        }}
      >
        <VStack gap={12} style={{ justifyItems: 'center' }}>
          <img
            alt=""
            src="https://cdn.zerion.io/images/dna-assets/empty-wallet-img.png"
            srcSet="https://cdn.zerion.io/images/dna-assets/empty-wallet-img.png, https://cdn.zerion.io/images/dna-assets/empty-wallet-img_2x.png 2x"
            style={{ height: 64 }}
          />
          <VStack gap={0}>
            <UIText kind="headline/h1">Get Started</UIText>
            <UIText kind="body/regular" color="var(--neutral-600)">
              By adding crypto to your wallet
            </UIText>
          </VStack>
        </VStack>
        <VStack gap={8}>
          <Button
            size={48}
            kind="primary"
            onClick={() => {
              dialogRef.current?.showModal();
            }}
          >
            <HStack gap={8} alignItems="center" justifyContent="center">
              <ArrowCircleIcon />
              <span>Fund</span>
            </HStack>
          </Button>
        </VStack>
      </VStack>
      <AddFundsOptionsDialog
        dialogRef={dialogRef}
        address={wallet.address}
        buyCryptoHref={buyCryptoHref}
      />
    </>
  );
}

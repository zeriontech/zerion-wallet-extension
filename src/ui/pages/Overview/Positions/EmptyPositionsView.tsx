import React, { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import ArrowCircleIcon from 'jsx:src/ui/assets/arrow-circle-outlined.svg';
import IdentityIcon from 'jsx:src/ui/assets/identity.svg';
import QrCodeIcon from 'jsx:src/ui/assets/qr-code.svg';
import { EmptyView } from 'src/ui/components/EmptyView';
import { usePreferences } from 'src/ui/features/preferences';
import { walletPort } from 'src/ui/shared/channels';
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
import { emitter } from 'src/ui/shared/events';
import { useLocation } from 'react-router-dom';

const ZERION_ORIGIN = 'https://app.zerion.io';

function AddFundsOptionsDialog({
  address,
  buyCryptoHref,
  dialogRef,
  analytics,
}: {
  address: string;
  buyCryptoHref: string;
  dialogRef: React.RefObject<HTMLDialogElementInterface>;
  analytics: { pathname: string; address: string };
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
              onClick={() => {
                emitter.emit('buttonClicked', {
                  buttonName: 'Buy Crypto',
                  buttonScope: 'General',
                  pathname: analytics.pathname,
                  walletAddress: analytics.address,
                });
              }}
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
              onClick={() => {
                emitter.emit('buttonClicked', {
                  buttonName: 'Receive Crypto',
                  buttonScope: 'General',
                  pathname: analytics.pathname,
                  walletAddress: analytics.address,
                });
              }}
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
  const { pathname } = useLocation();
  const { data: wallet } = useQuery({
    queryKey: ['wallet/uiGetCurrentWallet'],
    queryFn: () => {
      return walletPort.request('uiGetCurrentWallet');
    },
  });

  const { preferences } = usePreferences();
  const addWalletParams = useWalletParams(wallet);
  const dialogRef = useRef<HTMLDialogElementInterface>(null);

  const isTestnetMode = preferences?.testnetMode?.on;

  if (isTestnetMode || !wallet) {
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
              emitter.emit('bannerClicked', {
                pathname,
                bannerName: 'Get started',
                walletAddress: wallet.address,
                bannerType: 'Fund_wallet',
                bannerSource: 'Internal',
              });
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
        analytics={{ pathname, address: wallet.address }}
      />
    </>
  );
}

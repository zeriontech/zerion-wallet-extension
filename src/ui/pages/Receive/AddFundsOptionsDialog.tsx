import React from 'react';
import type { ExternallyOwnedAccount } from 'src/shared/types/ExternallyOwnedAccount';
import IdentityIcon from 'jsx:src/ui/assets/identity.svg';
import QrCodeIcon from 'jsx:src/ui/assets/qr-code.svg';
import { emitter } from 'src/ui/shared/events';
import { useWalletParams } from 'src/ui/shared/requests/useWalletParams';
import {
  FrameListItemAnchor,
  FrameListItemLink,
} from 'src/ui/ui-kit/FrameList';
import { Media } from 'src/ui/ui-kit/Media';
import { BottomSheetDialog } from 'src/ui/ui-kit/ModalDialogs/BottomSheetDialog';
import { DialogTitle } from 'src/ui/ui-kit/ModalDialogs/DialogTitle';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { useOpenAndConnectToZerion } from '../Overview/ActionButtonsRow/ActionButtonsRow';

const ZERION_ORIGIN = 'https://app.zerion.io';

export function AddFundsOptionsDialog({
  wallet,
  dialogRef,
  analytics,
}: {
  wallet: ExternallyOwnedAccount;
  dialogRef: React.RefObject<HTMLDialogElementInterface>;
  analytics: { pathname: string; address: string };
}) {
  const addWalletParams = useWalletParams(wallet);
  const buyCryptoHref = `${ZERION_ORIGIN}/deposit?${addWalletParams}`;
  const { handleAnchorClick } = useOpenAndConnectToZerion({
    address: wallet.address,
  });
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
              onClick={(event) => {
                handleAnchorClick(event);
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
              to={`/receive?address=${wallet.address}`}
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

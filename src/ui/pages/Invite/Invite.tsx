import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { BackButton } from 'src/ui/components/BackButton';
import { getBackOrHome } from 'src/ui/shared/navigation/getBackOrHome';
import { HStack } from 'src/ui/ui-kit/HStack';
import CardsLeftIcon from 'jsx:src/ui/assets/cards-left.svg';
import CardsRightIcon from 'jsx:src/ui/assets/cards-right.svg';
import ArrowDownIcon from 'jsx:src/ui/assets/caret-down-filled.svg';
import AccountIcon from 'jsx:src/ui/assets/account.svg';
import XpIcon from 'jsx:src/ui/assets/xp.svg';
import ConnectIcon from 'jsx:src/ui/assets/technology-connect.svg';
import QrCodeIcon from 'jsx:src/ui/assets/qr-code.svg';
import type { WalletGroup } from 'src/shared/types/WalletGroup';
import type { ExternallyOwnedAccount } from 'src/shared/types/ExternallyOwnedAccount';
import type { BareWallet } from 'src/shared/types/BareWallet';
import { FillView } from 'src/ui/components/FillView';
import type { DeviceAccount } from 'src/shared/types/Device';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { useWalletGroups } from 'src/ui/shared/requests/useWalletGroups';
import { walletPort } from 'src/ui/shared/channels';
import { WalletAvatar } from 'src/ui/components/WalletAvatar';
import { WalletDisplayName } from 'src/ui/components/WalletDisplayName';
import { useBackgroundKind } from 'src/ui/components/Background';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { Frame } from 'src/ui/ui-kit/Frame';
import { Button } from 'src/ui/ui-kit/Button';
import { BottomSheetDialog } from 'src/ui/ui-kit/ModalDialogs/BottomSheetDialog';
import { CopyButton } from 'src/ui/components/CopyButton';
import { TextAnchor } from 'src/ui/ui-kit/TextAnchor';
import { DialogTitle } from 'src/ui/ui-kit/ModalDialogs/DialogTitle';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import { KeyboardShortcut } from 'src/ui/components/KeyboardShortcut';
import { PageBottom } from 'src/ui/components/PageBottom';
import { CenteredDialog } from 'src/ui/ui-kit/ModalDialogs/CenteredDialog';
import { invariant } from 'src/shared/invariant';
import { ZerionAPI } from 'src/modules/zerion-api/zerion-api.client';
import type { XpDistribution } from 'defi-sdk';
import { WalletList } from '../WalletSelect/WalletList';
import { InviteLinkDialog } from './InviteLinkDialog';
import { InvitationCodeDialog } from './InvitationCodeDialog';
import { QRCodeDialog } from './QRCodeDialog';
import * as styles from './styles.module.css';
import { SuccessDialog } from './SuccessDialog';

function WalletSelectDialog({
  value,
  walletGroups,
  onSelect,
}: {
  value: string;
  walletGroups?: WalletGroup[] | null;
  onSelect(wallet: ExternallyOwnedAccount | BareWallet | DeviceAccount): void;
}) {
  return walletGroups?.length ? (
    <>
      <DialogTitle
        title={<UIText kind="body/accent">Select Wallet</UIText>}
        closeKind="icon"
      />
      <WalletList
        selectedAddress={value}
        walletGroups={walletGroups}
        onSelect={onSelect}
        showAddressValues={true}
      />
    </>
  ) : (
    <FillView>
      <UIText kind="headline/h2" color="var(--neutral-500)">
        No Wallets
      </UIText>
    </FillView>
  );
}

function ReferralCode({ value }: { value: string }) {
  return (
    <Frame style={{ padding: 24 }}>
      <VStack gap={8} style={{ justifyItems: 'center' }}>
        <UIText kind="body/accent">Referral Code</UIText>
        <HStack
          gap={8}
          alignItems="center"
          style={{ gridAutoColumns: '1fr auto' }}
        >
          <UIText
            kind="headline/h1"
            className={styles.referralCode}
            title={value}
          >
            {value}
          </UIText>
          <CopyButton
            title="Copy Referral Code"
            textToCopy={value}
            size={24}
            btnStyle={{
              padding: 0,
              display: 'block',
              ['--button-text' as string]:
                'var(--copy-button-text-color, var(--neutral-500))',
            }}
          />
        </HStack>
      </VStack>
    </Frame>
  );
}

function ActionButtons({
  onShowInviteLink,
  onShowQRCode,
}: {
  onShowInviteLink: () => void;
  onShowQRCode: () => void;
}) {
  const buttonStyle = { paddingInline: 0 };
  return (
    <HStack gap={8} style={{ gridAutoColumns: '1fr 1fr' }}>
      <Button kind="primary" style={buttonStyle} onClick={onShowInviteLink}>
        <HStack gap={8} alignItems="center" justifyContent="center">
          <UIText kind="body/accent">Invite Link</UIText>
          <ConnectIcon />
        </HStack>
      </Button>
      <Button kind="primary" style={buttonStyle} onClick={onShowQRCode}>
        <HStack gap={8} alignItems="center" justifyContent="center">
          <UIText kind="body/accent">QR Code</UIText>
          <QrCodeIcon />
        </HStack>
      </Button>
    </HStack>
  );
}

function StatsItem({
  icon,
  text,
  value,
}: {
  icon: React.ReactNode;
  text: React.ReactNode;
  value: React.ReactNode;
}) {
  return (
    <Frame style={{ padding: 16 }}>
      <VStack gap={8}>
        <HStack gap={16} justifyContent="space-between">
          {value}
          {icon}
        </HStack>
        {text}
      </VStack>
    </Frame>
  );
}

function Stats({ xp }: { xp: XpDistribution }) {
  const hasReferralActivity = xp.earned > 0 || xp.referred > 0;
  return (
    <VStack gap={16}>
      <UIText kind="headline/h3">Stats</UIText>
      {hasReferralActivity ? (
        <HStack gap={8} style={{ gridAutoColumns: '1fr 1fr' }}>
          <StatsItem
            icon={<XpIcon />}
            text={
              <UIText kind="small/regular" color="var(--neutral-500)">
                Earned
              </UIText>
            }
            value={<UIText kind="headline/h2">{xp.earned}</UIText>}
          />
          <StatsItem
            icon={<AccountIcon />}
            text={
              <UIText kind="small/regular" color="var(--neutral-500)">
                Users Invited
              </UIText>
            }
            value={<UIText kind="headline/h2">{xp.referred}</UIText>}
          />
        </HStack>
      ) : (
        <Frame className={styles.noReferralActivity} style={{ padding: 32 }}>
          <UIText kind="body/regular" color="var(--neutral-500)">
            No Referral Activity Yet
          </UIText>
        </Frame>
      )}
    </VStack>
  );
}

function ChangeWalletButton({
  currentWallet,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  currentWallet: ExternallyOwnedAccount;
}) {
  return (
    <Button
      type="button"
      kind="text-primary"
      title="Select Wallet"
      className="parent-hover"
      size={40}
      style={{
        ['--button-text-hover' as string]: 'var(--neutral-800)',
        ['--parent-content-color' as string]: 'var(--neutral-500)',
        ['--parent-hovered-content-color' as string]: 'var(--black)',
        padding: 12,
        borderRadius: 12,
        backgroundColor: 'var(--neutral-100)',
      }}
      {...props}
    >
      <HStack gap={32} alignItems="center" justifyContent="space-between">
        <HStack gap={12} alignItems="center">
          <WalletAvatar
            address={currentWallet.address}
            size={36}
            borderRadius={12}
            active={false}
          />
          <UIText
            kind="headline/h3"
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            <WalletDisplayName wallet={currentWallet} />
          </UIText>
        </HStack>
        <ArrowDownIcon
          className="content-hover"
          style={{ width: 24, height: 24 }}
        />
      </HStack>
    </Button>
  );
}

function Heading({
  title,
  subtitle,
}: {
  title: React.ReactNode;
  subtitle: React.ReactNode;
}) {
  const navigate = useNavigate();
  return (
    <div className={styles.heading}>
      <BackButton
        className={styles.backButton}
        onClick={() => navigate(getBackOrHome() as number)}
      />
      <KeyboardShortcut
        combination="backspace"
        onKeyDown={() => navigate(-1)}
      />
      <NavigationTitle title={null} documentTitle="Invite Friends to Zerion" />
      <CardsLeftIcon className={styles.cardsLeft} />
      <CardsRightIcon className={styles.cardsRight} />
      <VStack gap={24} className={styles.titleContainer}>
        <UIText kind="headline/hero">{title}</UIText>
        <UIText kind="headline/h3">{subtitle}</UIText>
      </VStack>
    </div>
  );
}

export function Invite() {
  const { data: walletGroups, isLoading: isLoadingWalletGroups } =
    useWalletGroups();
  const { data: currentWallet } = useQuery({
    queryKey: ['wallet/uiGetCurrentWallet'],
    queryFn: () => {
      return walletPort.request('uiGetCurrentWallet');
    },
  });

  const { data: currentWalletMeta } = useQuery({
    enabled: Boolean(currentWallet?.address),
    queryKey: ['zpi/get-wallets-meta', currentWallet?.address],
    queryFn: async () => {
      invariant(currentWallet?.address, 'current wallet should be defined');
      const response = await ZerionAPI.getWalletsMeta({
        identifiers: [currentWallet?.address],
      });
      return response.data?.[0];
    },
  });

  const {
    mutate: applyReferralCode,
    isError,
    error,
  } = useMutation({
    mutationFn: async (referraCode: string) => {
      // const response = await ZerionAPI.refer
    },
  });

  const walletSelectDialogRef = useRef<HTMLDialogElementInterface | null>(null);
  const inviteLinkDialogRef = useRef<HTMLDialogElementInterface | null>(null);
  const qrCodeDialogRef = useRef<HTMLDialogElementInterface | null>(null);
  const invitationCodeDialogRef = useRef<HTMLDialogElementInterface | null>(
    null
  );
  const successDialogRef = useRef<HTMLDialogElementInterface | null>(null);

  const initialReferralCode = currentWalletMeta?.membership.referral_code;
  const [selectedWallet, setSelectedWallet] = useState(currentWallet);
  const [referralCode, setReferralCode] = useState(initialReferralCode);

  const inviteUrl = `https://link.zerion.io/referral?code=${referralCode}`;

  useBackgroundKind({ kind: 'white' });
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const referrerWallet = currentWallet;
  // const referrerWallet = currentWallet;
  const referrerWalletAddress = currentWallet?.address;

  if (
    !selectedWallet ||
    !currentWalletMeta ||
    !referralCode ||
    isLoadingWalletGroups
  ) {
    return null;
  }

  return (
    <>
      <Heading
        title="Invite Friends to Zerion"
        subtitle="Earn 10% of your invitee's XP and gift free Premium"
      />
      <PageColumn>
        <PageTop />
        <VStack gap={32}>
          <VStack gap={16}>
            <ChangeWalletButton
              currentWallet={selectedWallet}
              onClick={() => walletSelectDialogRef.current?.showModal()}
            />
            <ReferralCode value={referralCode} />
            <ActionButtons
              onShowInviteLink={() => inviteLinkDialogRef.current?.showModal()}
              onShowQRCode={() => qrCodeDialogRef.current?.showModal()}
            />
          </VStack>
          <VStack gap={16}>
            <Stats xp={currentWalletMeta.membership.xp} />
            {/* TODO: Uncomment when this page is ready: */}
            {/* <Button */}
            {/*   kind="regular" */}
            {/*   as={UnstyledAnchor} */}
            {/*   href="https://app.zerion.io/rewards" */}
            {/*   target="_blank" */}
            {/* > */}
            {/*   <UIText kind="body/accent">Explore Rewards</UIText> */}
            {/* </Button> */}
            {referrerWallet ? (
              <UIText
                kind="small/regular"
                color="var(--neutral-500)"
                style={{
                  textAlign: 'center',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                You were invited by{' '}
                <TextAnchor
                  style={{ color: 'var(--primary)' }}
                  href={`https://app.zerion.io/${referrerWalletAddress}/overview`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <WalletDisplayName wallet={referrerWallet} />
                </TextAnchor>
              </UIText>
            ) : (
              <Button
                kind="ghost"
                onClick={() => invitationCodeDialogRef.current?.showModal()}
              >
                Enter Referral Code
              </Button>
            )}
            <Button
              kind="regular"
              onClick={() => successDialogRef.current?.showModal()}
            >
              Success
            </Button>
          </VStack>
        </VStack>
        <BottomSheetDialog
          ref={walletSelectDialogRef}
          height="fit-content"
          renderWhenOpen={() => (
            <WalletSelectDialog
              walletGroups={walletGroups}
              value={normalizeAddress(selectedWallet.address)}
              onSelect={(wallet) => {
                walletSelectDialogRef.current?.close();
                setSelectedWallet(wallet);
              }}
            />
          )}
        />
        <BottomSheetDialog
          ref={inviteLinkDialogRef}
          height="fit-content"
          renderWhenOpen={() => <InviteLinkDialog inviteUrl={inviteUrl} />}
        />
        <BottomSheetDialog
          ref={qrCodeDialogRef}
          height="fit-content"
          renderWhenOpen={() => <QRCodeDialog inviteUrl={inviteUrl} />}
        />
        <BottomSheetDialog
          ref={invitationCodeDialogRef}
          height="fit-content"
          renderWhenOpen={() => (
            <InvitationCodeDialog
              onDismiss={() => invitationCodeDialogRef.current?.close()}
              onSubmit={(referralCode) => {
                invitationCodeDialogRef.current?.close();
                applyReferralCode(referralCode);
              }}
            />
          )}
        />
        <CenteredDialog
          ref={successDialogRef}
          renderWhenOpen={() => {
            invariant(referrerWallet, 'referrerWallet must be defined');
            return (
              <SuccessDialog
                referrerWallet={referrerWallet}
                onDismiss={() => successDialogRef.current?.close()}
              />
            );
          }}
        />
        <PageBottom />
      </PageColumn>
    </>
  );
}

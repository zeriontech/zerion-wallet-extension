import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { BackButton } from 'src/ui/components/BackButton';
import { getBackOrHome } from 'src/ui/shared/navigation/getBackOrHome';
import { HStack } from 'src/ui/ui-kit/HStack';
import CardsLeftSrc from 'src/ui/assets/cards-left.png';
import CardsLeft2xSrc from 'src/ui/assets/cards-left@2x.png';
import CardsRightSrc from 'src/ui/assets/cards-right.png';
import CardsRight2xSrc from 'src/ui/assets/cards-right@2x.png';
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
import { DialogTitle } from 'src/ui/ui-kit/ModalDialogs/DialogTitle';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import { KeyboardShortcut } from 'src/ui/components/KeyboardShortcut';
import { PageBottom } from 'src/ui/components/PageBottom';
import { CenteredDialog } from 'src/ui/ui-kit/ModalDialogs/CenteredDialog';
import { invariant } from 'src/shared/invariant';
import type { XpDistribution } from 'defi-sdk';
import { isReadonlyContainer } from 'src/shared/types/validators';
import { UnstyledAnchor } from 'src/ui/ui-kit/UnstyledAnchor';
import { WalletList } from '../WalletSelect/WalletList';
import { ReferralLinkDialog } from './ReferralLinkDialog';
import { InvitationCodeDialog } from './InvitationCodeDialog';
import { QRCodeDialog } from './QRCodeDialog';
import { SuccessDialog } from './SuccessDialog';
import { useWalletsMeta } from './shared/useWalletsMeta';
import { ReferrerLink } from './shared/ReferrerLink';
import * as styles from './styles.module.css';

const SHOW_EXPLORE_REWARDS_BUTTON = process.env.NODE_ENV === 'development';

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
      <img
        alt=""
        src={CardsLeftSrc}
        srcSet={`${CardsLeftSrc}, ${CardsLeft2xSrc} 2x`}
        className={styles.cardsLeft}
      />
      <img
        alt=""
        src={CardsRightSrc}
        srcSet={`${CardsRightSrc}, ${CardsRight2xSrc} 2x`}
        className={styles.cardsRight}
      />
      <VStack gap={24} className={styles.titleContainer}>
        <UIText kind="headline/hero">{title}</UIText>
        <UIText kind="headline/h3">{subtitle}</UIText>
      </VStack>
    </div>
  );
}

export function Invite() {
  useBackgroundKind({ kind: 'white' });
  useEffect(() => window.scrollTo(0, 0), []);

  const { data: currentWallet } = useQuery({
    queryKey: ['wallet/uiGetCurrentWallet'],
    queryFn: () => walletPort.request('uiGetCurrentWallet'),
  });
  const [selectedWallet, setSelectedWallet] = useState(currentWallet);

  const { data: walletGroups, ...walletGroupsQuery } = useWalletGroups();
  const ownedWalletGroups = useMemo(
    () =>
      walletGroups?.filter(
        (group) => !isReadonlyContainer(group.walletContainer)
      ),
    [walletGroups]
  );
  const ownedAddresses = useMemo(
    () =>
      ownedWalletGroups?.flatMap((group) =>
        group.walletContainer.wallets.map((wallet) => wallet.address)
      ),
    [ownedWalletGroups]
  );
  const { data: walletsMeta } = useWalletsMeta({
    addresses: selectedWallet?.address ? [selectedWallet.address] : [],
  });
  const walletMeta = walletsMeta?.[0];

  const walletSelectDialogRef = useRef<HTMLDialogElementInterface | null>(null);
  const referralLinkDialogRef = useRef<HTMLDialogElementInterface | null>(null);
  const qrCodeDialogRef = useRef<HTMLDialogElementInterface | null>(null);
  const invitationCodeDialogRef = useRef<HTMLDialogElementInterface | null>(
    null
  );
  const successDialogRef = useRef<HTMLDialogElementInterface | null>(null);

  if (!walletMeta) {
    return null;
  }

  const referrer = walletMeta.membership.referrer || null;
  const myReferralCode = walletMeta.membership.referralCode || null;
  const myReferralLink = walletMeta.membership.referralLink;

  if (
    !selectedWallet ||
    !walletMeta ||
    walletGroupsQuery.isLoading ||
    !ownedAddresses
  ) {
    return null;
  }

  return (
    <VStack gap={16}>
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
            {myReferralCode ? <ReferralCode value={myReferralCode} /> : null}
            {myReferralLink ? (
              <ActionButtons
                onShowInviteLink={() =>
                  referralLinkDialogRef.current?.showModal()
                }
                onShowQRCode={() => qrCodeDialogRef.current?.showModal()}
              />
            ) : null}
          </VStack>
          <VStack gap={16}>
            <Stats xp={walletMeta.membership.xp} />
            {myReferralCode && SHOW_EXPLORE_REWARDS_BUTTON ? (
              <Button
                kind="regular"
                as={UnstyledAnchor}
                href="https://app.zerion.io/rewards"
                target="_blank"
              >
                <UIText kind="body/accent">Explore Rewards</UIText>
              </Button>
            ) : null}
            {referrer?.address ? (
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
                <ReferrerLink
                  handle={referrer.handle}
                  address={referrer.address}
                  style={{ color: 'var(--primary)' }}
                />
              </UIText>
            ) : (
              <Button
                kind="ghost"
                onClick={() => invitationCodeDialogRef.current?.showModal()}
              >
                Enter Referral Code
              </Button>
            )}
          </VStack>
        </VStack>
        <BottomSheetDialog
          ref={walletSelectDialogRef}
          height="fit-content"
          renderWhenOpen={() => (
            <WalletSelectDialog
              walletGroups={ownedWalletGroups}
              value={normalizeAddress(selectedWallet.address)}
              onSelect={(wallet) => {
                walletSelectDialogRef.current?.close();
                setSelectedWallet(wallet);
              }}
            />
          )}
        />
        {myReferralLink ? (
          <BottomSheetDialog
            ref={referralLinkDialogRef}
            height="fit-content"
            renderWhenOpen={() => (
              <ReferralLinkDialog myReferralLink={myReferralLink} />
            )}
          />
        ) : null}
        {myReferralLink ? (
          <BottomSheetDialog
            ref={qrCodeDialogRef}
            height="fit-content"
            renderWhenOpen={() => (
              <QRCodeDialog myReferralLink={myReferralLink} />
            )}
          />
        ) : null}
        <BottomSheetDialog
          ref={invitationCodeDialogRef}
          height="fit-content"
          renderWhenOpen={() => (
            <InvitationCodeDialog
              ownedAddresses={ownedAddresses}
              myReferralCode={myReferralCode}
              onDismiss={() => invitationCodeDialogRef.current?.close()}
              onSuccess={() => successDialogRef.current?.showModal()}
            />
          )}
        />
        <CenteredDialog
          style={{ maxWidth: 'var(--body-width)' }}
          ref={successDialogRef}
          renderWhenOpen={() => {
            invariant(referrer, 'referrer must be defined');
            return (
              <SuccessDialog
                referrer={referrer}
                onDismiss={() => successDialogRef.current?.close()}
              />
            );
          }}
        />
        <PageBottom />
      </PageColumn>
    </VStack>
  );
}

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { BackButton } from 'src/ui/components/BackButton';
import { getBackOrHome } from 'src/ui/shared/navigation/getBackOrHome';
import { HStack } from 'src/ui/ui-kit/HStack';
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
import { isReadonlyContainer } from 'src/shared/types/validators';
import { UnstyledAnchor } from 'src/ui/ui-kit/UnstyledAnchor';
import { WalletList } from 'src/ui/pages/WalletSelect/WalletList';
import type { ReferrerData } from 'src/modules/zerion-api/requests/check-referral';
import { ReferralLinkDialog } from './ReferralLinkDialog';
import { EnterReferralCodeDialog } from './EnterReferralCodeDialog';
import { QRCodeDialog } from './QRCodeDialog';
import { SuccessDialog } from './SuccessDialog';
import { useWalletsMetaByChunks } from './shared/useWalletsMetaByChunks';
import { ReferrerLink } from './shared/ReferrerLink';
import * as styles from './styles.module.css';

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
    <div style={{ ['--surface-background-color' as string]: 'none' }}>
      <DialogTitle title={<UIText kind="body/accent">Select Wallet</UIText>} />
      <WalletList
        selectedAddress={value}
        walletGroups={walletGroups}
        onSelect={onSelect}
        showAddressValues={true}
      />
    </div>
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
        <HStack
          gap={16}
          justifyContent="space-between"
          style={{ gridAutoColumns: '1fr auto' }}
        >
          {value}
          {icon}
        </HStack>
        {text}
      </VStack>
    </Frame>
  );
}

function Stats({ earned, referred }: { earned: number; referred: number }) {
  const hasReferralActivity = earned > 0 || referred > 0;
  return (
    <VStack gap={16}>
      <UIText kind="headline/h3">Stats</UIText>
      {hasReferralActivity ? (
        <HStack gap={8} style={{ gridAutoColumns: '1fr 1fr' }}>
          <StatsItem
            icon={<XpIcon style={{ color: 'var(--black)' }} />}
            text={
              <UIText kind="small/regular" color="var(--neutral-500)">
                Earned
              </UIText>
            }
            value={
              <UIText kind="headline/h2" style={{ wordBreak: 'break-all' }}>
                {earned}
              </UIText>
            }
          />
          <StatsItem
            icon={<AccountIcon />}
            text={
              <UIText kind="small/regular" color="var(--neutral-500)">
                Users Invited
              </UIText>
            }
            value={
              <UIText kind="headline/h2" style={{ wordBreak: 'break-all' }}>
                {referred}
              </UIText>
            }
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
              whiteSpace: 'nowrap',
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
        onKeyDown={() => navigate(getBackOrHome() as number)}
      />
      <NavigationTitle title={null} documentTitle="Invite Friends to Zerion" />
      <img
        alt=""
        src="https://s3.us-east-1.amazonaws.com/cdn.zerion.io/images/dna-assets/invite-flow-decoration-left.png"
        srcSet="https://s3.us-east-1.amazonaws.com/cdn.zerion.io/images/dna-assets/invite-flow-decoration-left.png, https://s3.us-east-1.amazonaws.com/cdn.zerion.io/images/dna-assets/invite-flow-decoration-left_2x.png 2x"
        className={styles.cardsLeft}
      />
      <img
        alt=""
        src="https://s3.us-east-1.amazonaws.com/cdn.zerion.io/images/dna-assets/invite-flow-decoration-right.png"
        srcSet="https://s3.us-east-1.amazonaws.com/cdn.zerion.io/images/dna-assets/invite-flow-decoration-right.png, https://s3.us-east-1.amazonaws.com/cdn.zerion.io/images/dna-assets/invite-flow-decoration-right_2x.png 2x"
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
  const [pendingReferrer, setPendingReferrer] = useState<ReferrerData | null>(
    null
  );

  const { data: walletGroups, ...walletGroupsQuery } = useWalletGroups();
  const ownedWalletGroups = useMemo(
    () =>
      (walletGroups ?? []).filter(
        (group) => !isReadonlyContainer(group.walletContainer)
      ),
    [walletGroups]
  );
  const { data: walletsMeta } = useWalletsMetaByChunks({
    addresses: selectedWallet?.address ? [selectedWallet.address] : [],
  });
  const walletMeta = walletsMeta?.[0];

  const walletSelectDialogRef = useRef<HTMLDialogElementInterface | null>(null);
  const referralLinkDialogRef = useRef<HTMLDialogElementInterface | null>(null);
  const qrCodeDialogRef = useRef<HTMLDialogElementInterface | null>(null);
  const enterReferralCodeDialogRef = useRef<HTMLDialogElementInterface | null>(
    null
  );
  const successDialogRef = useRef<HTMLDialogElementInterface | null>(null);

  if (!walletMeta) {
    return null;
  }

  const referrer = walletMeta.membership.referrer || pendingReferrer;
  const myReferralCode = walletMeta.membership.referralCode || null;
  const myReferralLink = walletMeta.membership.referralLink;

  if (!selectedWallet || !walletMeta || walletGroupsQuery.isLoading) {
    return null;
  }

  return (
    <VStack gap={16}>
      <Heading
        title="Invite Friends to Zerion"
        subtitle="Earn 10% of your invitee’s XP and gift free Premium"
      />
      <PageColumn>
        <PageTop />
        <VStack gap={32}>
          <VStack gap={16}>
            {ownedWalletGroups.length > 1 ? (
              <ChangeWalletButton
                currentWallet={selectedWallet}
                onClick={() => walletSelectDialogRef.current?.showModal()}
              />
            ) : null}
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
            <Stats
              earned={walletMeta.membership.xp.earned}
              referred={walletMeta.membership.referred}
            />
            {myReferralCode ? (
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
                onClick={() => enterReferralCodeDialogRef.current?.showModal()}
              >
                Enter Referral Code
              </Button>
            )}
          </VStack>
        </VStack>
        <CenteredDialog
          ref={walletSelectDialogRef}
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
          ref={enterReferralCodeDialogRef}
          height="fit-content"
          renderWhenOpen={() => (
            <EnterReferralCodeDialog
              myReferralCode={myReferralCode}
              onDismiss={() => enterReferralCodeDialogRef.current?.close()}
              onSuccess={(pendingReferrer) => {
                setPendingReferrer(pendingReferrer);
                enterReferralCodeDialogRef.current?.close();
                successDialogRef.current?.showModal();
              }}
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

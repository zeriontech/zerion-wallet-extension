import { useQuery } from '@tanstack/react-query';
import React, { useMemo, useRef, useState } from 'react';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import type { BareWallet } from 'src/shared/types/BareWallet';
import type { DeviceAccount } from 'src/shared/types/Device';
import type { ExternallyOwnedAccount } from 'src/shared/types/ExternallyOwnedAccount';
import { isBareWallet, isSignerContainer } from 'src/shared/types/validators';
import { useBackgroundKind } from 'src/ui/components/Background';
import ArrowRightIcon from 'jsx:src/ui/assets/arrow-right.svg';
import DownIcon from 'jsx:src/ui/assets/chevron-down.svg';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { WalletAvatar } from 'src/ui/components/WalletAvatar';
import { WalletDisplayName } from 'src/ui/components/WalletDisplayName';
import { WalletList } from 'src/ui/pages/WalletSelect/WalletList';
import { walletPort } from 'src/ui/shared/channels';
import { useWalletGroups } from 'src/ui/shared/requests/useWalletGroups';
import { Button } from 'src/ui/ui-kit/Button';
import { HStack } from 'src/ui/ui-kit/HStack';
import { CenteredDialog } from 'src/ui/ui-kit/ModalDialogs/CenteredDialog';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { DialogTitle } from 'src/ui/ui-kit/ModalDialogs/DialogTitle';
import { PageBottom } from 'src/ui/components/PageBottom';
import { Frame } from 'src/ui/ui-kit/Frame';
import { PageStickyFooter } from 'src/ui/components/PageStickyFooter';
import { GradientBorder } from 'src/ui/components/GradientBorder';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import { getWalletsMetaByChunks } from 'src/modules/zerion-api/requests/wallet-get-meta';
import * as styles from './styles.module.css';

const xpFormatter = new Intl.NumberFormat('en-US');

function formatXp(value: number) {
  return xpFormatter.format(value);
}

function WalletSelectDialog({
  value,
  walletGroups,
  onSelect,
}: {
  value: string;
  walletGroups: {
    id: string;
    walletContainer: {
      wallets: (ExternallyOwnedAccount | BareWallet | DeviceAccount)[];
    };
  }[];
  onSelect(wallet: ExternallyOwnedAccount | BareWallet | DeviceAccount): void;
}) {
  return (
    <div style={{ ['--surface-background-color' as string]: 'none' }}>
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
    </div>
  );
}

function WalletLabel({ wallet }: { wallet: ExternallyOwnedAccount }) {
  return (
    <UIText
      kind="headline/h2"
      style={{
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
    >
      <WalletDisplayName wallet={wallet} />
    </UIText>
  );
}

function ChangeWalletButton({
  selectedWallet,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  selectedWallet: ExternallyOwnedAccount;
}) {
  return (
    <Button type="button" kind="text-primary" title="Select Wallet" {...props}>
      <HStack gap={4}>
        <WalletLabel wallet={selectedWallet} />
        <DownIcon
          width={24}
          height={24}
          style={{
            position: 'relative',
            top: 4,
          }}
        />
      </HStack>
    </Button>
  );
}

function StatsItem({
  title,
  value,
}: {
  title: React.ReactNode;
  value: React.ReactNode;
}) {
  return (
    <Frame style={{ padding: 16 }}>
      <VStack gap={4}>
        {title}
        {value}
      </VStack>
    </Frame>
  );
}

function Stats({ zerionOg, activity }: { zerionOg: number; activity: number }) {
  return (
    <HStack gap={8} style={{ gridAutoColumns: '1fr 1fr' }}>
      <StatsItem
        title={
          <UIText className={styles.zerionOgGradient} kind="small/accent">
            Zerion OG
          </UIText>
        }
        value={
          <UIText
            kind="headline/h2"
            className={styles.zerionOgGradient}
            style={{ wordBreak: 'break-all' }}
          >
            {formatXp(zerionOg)} XP
          </UIText>
        }
      />
      <StatsItem
        title={
          <UIText kind="small/accent" color="var(--neutral-700)">
            Activity
          </UIText>
        }
        value={
          <UIText kind="headline/h2" style={{ wordBreak: 'break-all' }}>
            {formatXp(activity)} XP
          </UIText>
        }
      />
    </HStack>
  );
}

function HCenter({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>{children}</div>
  );
}

function XpLevel({ claimedXp, level }: { claimedXp: number; level: number }) {
  return (
    <Frame style={{ padding: '14px 16px' }}>
      <HStack gap={16} alignItems="center">
        <GradientBorder
          borderColor="linear-gradient(90deg, #a024ef 0%, #fdbb6c 100%)"
          borderWidth={4}
          borderRadius={16}
          backgroundColor="var(--white)"
        >
          <UIText
            kind="headline/hero"
            className={styles.levelGradient}
            style={{ paddingInline: 8 }}
          >
            {level}
          </UIText>
        </GradientBorder>
        <UIText kind="small/accent" color="var(--neutral-700)">
          {formatXp(claimedXp)} XP claimed!
          <br />
          Your wallet is now level {level}
        </UIText>
      </HStack>
    </Frame>
  );
}

export function XpDropClaim() {
  useBackgroundKind({ kind: 'white' });

  const { data: currentWallet } = useQuery({
    queryKey: ['wallet/uiGetCurrentWallet'],
    queryFn: () => walletPort.request('uiGetCurrentWallet'),
  });
  const [selectedWallet, setSelectedWallet] = useState(currentWallet);

  const { data: walletGroups, ...walletGroupsQuery } = useWalletGroups();
  const signerWalletGroups = useMemo(
    () =>
      walletGroups?.filter((group) => isSignerContainer(group.walletContainer)),
    [walletGroups]
  );
  const ownedAddresses = useMemo(() => {
    return (
      signerWalletGroups
        ?.flatMap((group) => group.walletContainer.wallets.filter(isBareWallet))
        ?.map((wallet) => wallet.address) ?? []
    );
  }, [signerWalletGroups]);

  const { data: walletsMeta } = useQuery({
    queryKey: ['ZerionAPI.getWalletsMeta', ownedAddresses],
    queryFn: () => getWalletsMetaByChunks(ownedAddresses),
  });
  const eligibleWalletGroups = useMemo(() => {
    const eligibleAddresses = walletsMeta
      ?.filter((meta) => Boolean(meta.membership.retro))
      .map((meta) => normalizeAddress(meta.address));

    return signerWalletGroups
      ?.map((group) => ({
        id: group.id,
        walletContainer: {
          wallets: group.walletContainer.wallets.filter((wallet) =>
            eligibleAddresses?.includes(normalizeAddress(wallet.address))
          ),
        },
      }))
      .filter((group) => Boolean(group.walletContainer.wallets));
  }, [signerWalletGroups, walletsMeta]);

  const walletSelectDialogRef = useRef<HTMLDialogElementInterface | null>(null);

  if (!selectedWallet || !eligibleWalletGroups || walletGroupsQuery.isLoading) {
    return null;
  }

  const zerionOg = 396123;
  const activity = 224251;

  const hasClaimed = false;
  const isClaiming = false;

  return (
    <>
      <PageColumn>
        <NavigationTitle
          title={hasClaimed ? 'Congratulations!' : 'Claim Your XP'}
          backTo="/overview"
        />
        <PageTop />
        <VStack gap={16}>
          <HCenter>
            <WalletAvatar
              address={selectedWallet.address}
              size={104}
              active={false}
              borderRadius={24}
            />
          </HCenter>
          {eligibleWalletGroups.length > 1 ? (
            <HCenter>
              {hasClaimed ? (
                <WalletLabel wallet={selectedWallet} />
              ) : (
                <ChangeWalletButton
                  disabled={isClaiming}
                  selectedWallet={selectedWallet}
                  onClick={() => walletSelectDialogRef.current?.showModal()}
                />
              )}
            </HCenter>
          ) : null}
          {hasClaimed ? (
            <XpLevel level={10} claimedXp={zerionOg} />
          ) : (
            <>
              <Stats zerionOg={zerionOg} activity={activity} />
              <HCenter>
                <Button
                  kind="neutral"
                  size={36}
                  style={{ paddingInline: '12px' }}
                >
                  XP Breakdown
                </Button>
              </HCenter>
            </>
          )}
        </VStack>
        <CenteredDialog
          ref={walletSelectDialogRef}
          renderWhenOpen={() => (
            <WalletSelectDialog
              walletGroups={eligibleWalletGroups}
              value={normalizeAddress(selectedWallet.address)}
              onSelect={(wallet) => {
                walletSelectDialogRef.current?.close();
                setSelectedWallet(wallet);
              }}
            />
          )}
        />
      </PageColumn>
      <PageStickyFooter>
        {hasClaimed ? (
          <Button kind="primary" disabled={isClaiming}>
            {isClaiming ? (
              <HCenter>
                <CircleSpinner />
              </HCenter>
            ) : (
              <HStack gap={8} alignItems="center" justifyContent="center">
                <UIText kind="body/accent">Next Wallet</UIText>
                <ArrowRightIcon style={{ width: 20, height: 20 }} />
              </HStack>
            )}
          </Button>
        ) : (
          <Button kind="primary">Claim {formatXp(zerionOg)} XP</Button>
        )}
        <PageBottom />
      </PageStickyFooter>
    </>
  );
}

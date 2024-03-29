import React, { useEffect, useMemo, useRef } from 'react';
import { Link, Route, Routes, useSearchParams } from 'react-router-dom';
import DownloadIcon from 'jsx:src/ui/assets/download.svg';
import ConnectIcon from 'jsx:src/ui/assets/technology-connect.svg';
import VisibleIcon from 'jsx:src/ui/assets/visible.svg';
import ZerionSquircle from 'jsx:src/ui/assets/zerion-squircle.svg';
import InfoIcon from 'jsx:src/ui/assets/info.svg';
import AddCircleIcon from 'jsx:src/ui/assets/add-circle-outlined.svg';
import type { WalletGroup } from 'src/shared/types/WalletGroup';
import { isMnemonicContainer } from 'src/shared/types/validators';
import { AddressBadge } from 'src/ui/components/AddressBadge';
import { AngleRightRow } from 'src/ui/components/AngleRightRow';
import { FillView } from 'src/ui/components/FillView';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { PageBottom } from 'src/ui/components/PageBottom';
import { PageColumn } from 'src/ui/components/PageColumn';
import { getGroupDisplayName } from 'src/ui/shared/getGroupDisplayName';
import { openInTabView } from 'src/ui/shared/openInTabView';
import { useWalletGroups } from 'src/ui/shared/requests/useWalletGroups';
import { Button } from 'src/ui/ui-kit/Button';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { ItemLink as SurfaceItemLink } from 'src/ui/ui-kit/SurfaceList/SurfaceList';
import * as surfaceListStyles from 'src/ui/ui-kit/SurfaceList/styles.module.css';
import {
  useBackgroundKind,
  whiteBackgroundKind,
} from 'src/ui/components/Background/Background';
import { AddReadonlyAddress } from './AddReadonlyAddress';
import { GenerateWallet } from './GenerateWallet';
import { ImportWallet } from './ImportWallet';

function createNextHref(path: string, beforePath: string | null) {
  return beforePath ? `${beforePath}?next=${encodeURIComponent(path)}` : path;
}

function NewWalletOption({
  beforeCreate,
  mnemonicWalletGroups: mnemonicGroups,
}: {
  beforeCreate: string | null;
  mnemonicWalletGroups: WalletGroup[] | null;
}) {
  const autoFocusRef = useRef<HTMLAnchorElement | null>(null);
  useEffect(() => {
    autoFocusRef.current?.focus();
  }, []);
  const hasMnemonicWallets = mnemonicGroups ? mnemonicGroups.length > 0 : false;

  const newWalletPath = createNextHref('/get-started/new', beforeCreate);

  const elevationStyle = { boxShadow: 'var(--elevation-200)' };
  return (
    <VStack gap={8}>
      {hasMnemonicWallets ? (
        <Button
          ref={autoFocusRef}
          size={44}
          as={Link}
          to={`wallet-group-select?${
            beforeCreate ? new URLSearchParams({ beforeCreate }) : ''
          }`}
          style={elevationStyle}
        >
          Create New Wallet
        </Button>
      ) : (
        <Button
          ref={autoFocusRef}
          as={Link}
          to={newWalletPath}
          size={44}
          style={elevationStyle}
        >
          Create New Wallet
        </Button>
      )}
    </VStack>
  );
}

function SpaceZone({ children }: React.PropsWithChildren) {
  return (
    <div
      style={{
        borderRadius: 8,
        padding: 6,
        backgroundColor: 'var(--neutral-300)',
        display: 'grid',
      }}
    >
      {children}
    </div>
  );
}

function ScreenCover() {
  return (
    <FillView style={{ alignContent: 'start' }}>
      <Spacer height={70} />
      <ZerionSquircle style={{ width: 64, height: 64 }} />
      <Spacer height={24} />
      <UIText kind="headline/h1">Add Wallet</UIText>
      <Spacer height={4} />
      <UIText
        kind="body/regular"
        color="var(--neutral-500)"
        style={{ textAlign: 'center' }}
      >
        Choose your wallet setup options
      </UIText>
    </FillView>
  );
}

function Options() {
  const { data: walletGroups, isLoading } = useWalletGroups();
  const [params] = useSearchParams();
  const mnemonicGroups = useMemo(
    () =>
      walletGroups?.filter((group) =>
        isMnemonicContainer(group.walletContainer)
      ),
    [walletGroups]
  );

  useBackgroundKind(whiteBackgroundKind);

  if (isLoading) {
    return null;
  }

  const beforeCreate = params.get('beforeCreate');
  const isIntro = params.has('intro');
  return (
    <PageColumn>
      <NavigationTitle
        urlBar={isIntro ? 'none' : undefined}
        title={null}
        documentTitle="Get Started"
      />
      <ScreenCover />

      <VStack gap={8}>
        <NewWalletOption
          beforeCreate={beforeCreate}
          mnemonicWalletGroups={mnemonicGroups || null}
        />
        <Button
          kind="regular"
          size={44}
          as={Link}
          to={`/get-started/existing-select?beforeCreate=${beforeCreate || ''}`}
        >
          Add Existing Wallet
        </Button>
      </VStack>
      <PageBottom />
    </PageColumn>
  );
}

function TemporaryListItem({
  to,
  onClick,
  children,
}: React.PropsWithChildren<{
  to: string;
  onClick?: React.AnchorHTMLAttributes<HTMLAnchorElement>['onClick'];
}>) {
  return (
    <SurfaceItemLink
      // apply --hightlight-color
      className={surfaceListStyles.root}
      style={{
        padding: 0,
        border: '2px solid var(--neutral-100)',
        borderRadius: 14,
      }}
      to={to}
      onClick={onClick}
    >
      <div style={{ padding: 2 }}>{children}</div>
    </SurfaceItemLink>
  );
}

function ExistingWalletOptions() {
  const [params] = useSearchParams();

  const beforeCreate = params.get('beforeCreate');
  const importHref = createNextHref('/get-started/import', beforeCreate);
  const importLedgerHref = createNextHref(
    '/connect-hardware-wallet',
    beforeCreate
  );
  const addReadonlyHref = createNextHref('/get-started/readonly', beforeCreate);
  useBackgroundKind(whiteBackgroundKind);
  return (
    <PageColumn>
      <NavigationTitle title="Add Existing Wallet" />
      <ScreenCover />

      <VStack gap={8}>
        <TemporaryListItem to={importHref}>
          <AngleRightRow>
            <HStack gap={8} alignItems="center">
              <SpaceZone>
                <DownloadIcon />
              </SpaceZone>
              <div>
                <span>Import Wallet</span>
              </div>
            </HStack>
          </AngleRightRow>
        </TemporaryListItem>
        <TemporaryListItem to={importLedgerHref} onClick={openInTabView}>
          <AngleRightRow>
            <HStack gap={8} alignItems="center">
              <SpaceZone>
                <ConnectIcon />
              </SpaceZone>
              <span>Connect Hardware Wallet</span>
            </HStack>
          </AngleRightRow>
        </TemporaryListItem>
        <TemporaryListItem to={addReadonlyHref}>
          <AngleRightRow>
            <HStack gap={8} alignItems="center">
              <SpaceZone>
                <VisibleIcon />
              </SpaceZone>
              <span>Watch Address</span>
            </HStack>
          </AngleRightRow>
        </TemporaryListItem>
      </VStack>
      <PageBottom />
    </PageColumn>
  );
}
function WalletGroupSelect() {
  const [params] = useSearchParams();
  const beforeCreate = params.get('beforeCreate');
  const { data: walletGroups, isLoading } = useWalletGroups();
  const mnemonicGroups = useMemo(
    () =>
      walletGroups?.filter((group) =>
        isMnemonicContainer(group.walletContainer)
      ),
    [walletGroups]
  );
  useBackgroundKind(whiteBackgroundKind);
  const title = 'Select Backup';
  if (isLoading) {
    return null;
  }
  if (!mnemonicGroups) {
    throw new Error('Wallet Groups are required to display this view');
  }
  return (
    <PageColumn>
      <NavigationTitle title={null} documentTitle={title} />
      <Spacer height={8} />
      <UIText kind="headline/h2">
        {title}{' '}
        <span
          title="Each group contains wallets that are associated with same recovery phrase, stored locally on your device. Zerion does not have access to this data.

We do not cross-associate wallet addresses or have a way to know that these wallets are grouped."
        >
          <InfoIcon
            role="presentation"
            style={{
              width: 28,
              height: 28,
              verticalAlign: 'bottom',
              color: 'var(--neutral-500)',
            }}
          />
        </span>
      </UIText>
      <Spacer height={16} />
      <VStack gap={8}>
        {mnemonicGroups.map((group) => {
          return (
            <TemporaryListItem
              key={group.id}
              to={createNextHref(
                `/get-started/import/mnemonic?groupId=${group.id}`,
                beforeCreate
              )}
            >
              <AngleRightRow>
                <VStack gap={8}>
                  <UIText kind="body/accent">
                    {getGroupDisplayName(group.name)}
                  </UIText>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {group.walletContainer.wallets.map((wallet) => (
                      <AddressBadge key={wallet.address} wallet={wallet} />
                    ))}
                  </div>
                </VStack>
              </AngleRightRow>
            </TemporaryListItem>
          );
        })}
        <TemporaryListItem
          to={createNextHref('/get-started/new', beforeCreate)}
        >
          <HStack gap={8} alignItems="center">
            <SpaceZone>
              <AddCircleIcon />
            </SpaceZone>
            <UIText kind="body/accent">Create New Backup</UIText>
          </HStack>
        </TemporaryListItem>
      </VStack>
      <PageBottom />
    </PageColumn>
  );
}

export function GetStarted() {
  return (
    <Routes>
      <Route path="/" element={<Options />} />
      <Route path="/new" element={<GenerateWallet />} />
      <Route path="/import/*" element={<ImportWallet />} />
      <Route path="/wallet-group-select" element={<WalletGroupSelect />} />
      <Route path="/existing-select" element={<ExistingWalletOptions />} />
      <Route path="/readonly" element={<AddReadonlyAddress />} />
    </Routes>
  );
}

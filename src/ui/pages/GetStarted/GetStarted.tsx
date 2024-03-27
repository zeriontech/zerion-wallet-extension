import React, { useEffect, useMemo, useRef } from 'react';
import { Link, Route, Routes, useSearchParams } from 'react-router-dom';
import DownloadIcon from 'jsx:src/ui/assets/download.svg';
import ConnectIcon from 'jsx:src/ui/assets/technology-connect.svg';
import VisibleIcon from 'jsx:src/ui/assets/visible.svg';
import ZerionSquircle from 'jsx:src/ui/assets/zerion-squircle.svg';
import type { WalletGroup } from 'src/shared/types/WalletGroup';
import { isMnemonicContainer } from 'src/shared/types/validators';
import { AddressBadge } from 'src/ui/components/AddressBadge';
import { AngleRightRow } from 'src/ui/components/AngleRightRow';
import { Background } from 'src/ui/components/Background';
import { FillView } from 'src/ui/components/FillView';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { PageBottom } from 'src/ui/components/PageBottom';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { getGroupDisplayName } from 'src/ui/shared/getGroupDisplayName';
import { openInTabView } from 'src/ui/shared/openInTabView';
import { useWalletGroups } from 'src/ui/shared/requests/useWalletGroups';
import { Button } from 'src/ui/ui-kit/Button';
import { HStack } from 'src/ui/ui-kit/HStack';
import { BottomSheetDialog } from 'src/ui/ui-kit/ModalDialogs/BottomSheetDialog';
import { DialogTitle } from 'src/ui/ui-kit/ModalDialogs/DialogTitle';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { SurfaceList } from 'src/ui/ui-kit/SurfaceList';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
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

  const existingOptionsDialogRef = useRef<HTMLDialogElementInterface | null>(
    null
  );

  if (isLoading) {
    return null;
  }

  const beforeCreate = params.get('beforeCreate');
  const isIntro = params.has('intro');
  const importHref = createNextHref('/get-started/import', beforeCreate);
  const importLedgerHref = createNextHref(
    '/connect-hardware-wallet',
    beforeCreate
  );
  const addReadonlyHref = createNextHref('/get-started/readonly', beforeCreate);
  return (
    <Background backgroundKind="white">
      <BottomSheetDialog
        ref={existingOptionsDialogRef}
        height="fit-content"
        containerStyle={{ backgroundColor: 'var(--neutral-100)' }}
        renderWhenOpen={() => (
          <div style={{ textAlign: 'start' }}>
            <UIText kind="headline/h3">
              <DialogTitle
                title="Add Existing Wallet"
                alignTitle="start"
                closeKind="icon"
              />
            </UIText>
            <Spacer height={24} />
            <SurfaceList
              items={[
                {
                  key: 0,
                  to: importHref,
                  component: (
                    <HStack gap={8} alignItems="center">
                      <SpaceZone>
                        <DownloadIcon />
                      </SpaceZone>
                      <div>
                        <span>Import Wallet</span>
                      </div>
                    </HStack>
                  ),
                },
                {
                  key: 1,
                  to: importLedgerHref,
                  onClick: openInTabView,
                  component: (
                    <HStack gap={8} alignItems="center">
                      <SpaceZone>
                        <ConnectIcon />
                      </SpaceZone>
                      <span>Connect Hardware Wallet</span>
                    </HStack>
                  ),
                },
                {
                  key: 2,
                  to: addReadonlyHref,
                  component: (
                    <HStack gap={8} alignItems="center">
                      <SpaceZone>
                        <VisibleIcon />
                      </SpaceZone>
                      <span>Watch Address</span>
                    </HStack>
                  ),
                },
              ]}
            />
          </div>
        )}
      />
      <PageColumn>
        <NavigationTitle
          urlBar={isIntro ? 'none' : undefined}
          title={null}
          documentTitle="Get Started"
        />
        <FillView>
          <ZerionSquircle style={{ width: 64, height: 64 }} />
          <Spacer height={46} />
          <UIText kind="headline/h1">Zerion Wallet</UIText>
          <Spacer height={8} />
          <UIText kind="body/regular" style={{ textAlign: 'center' }}>
            All your crypto and NFTs. 10+ chains.
            <br />
            Non-custodial.
          </UIText>
        </FillView>

        <VStack gap={8}>
          <NewWalletOption
            beforeCreate={beforeCreate}
            mnemonicWalletGroups={mnemonicGroups || null}
          />
          <Button
            kind="regular"
            size={44}
            onClick={() => existingOptionsDialogRef.current?.showModal()}
          >
            Add Existing Wallet
          </Button>
        </VStack>
        <PageBottom />
      </PageColumn>
    </Background>
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
  if (isLoading) {
    return null;
  }
  if (!mnemonicGroups) {
    throw new Error('Wallet Groups are required to display this view');
  }
  return (
    <PageColumn>
      <NavigationTitle title="Create New Wallet" />
      <PageTop />
      <VStack gap={20}>
        <VStack gap={8}>
          <UIText kind="small/regular" color="var(--neutral-500)">
            Add new address to an existing group
          </UIText>

          <SurfaceList
            items={mnemonicGroups.map((group) => {
              return {
                key: group.id,
                to: createNextHref(
                  `/get-started/import/mnemonic?groupId=${group.id}`,
                  beforeCreate
                ),
                component: (
                  <AngleRightRow>
                    <VStack gap={4}>
                      <UIText kind="small/accent">
                        {getGroupDisplayName(group.name)}
                      </UIText>
                      <div
                        style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}
                      >
                        {group.walletContainer.wallets.map((wallet) => (
                          <AddressBadge key={wallet.address} wallet={wallet} />
                        ))}
                      </div>
                    </VStack>
                  </AngleRightRow>
                ),
              };
            })}
          />
        </VStack>
        <VStack gap={8}>
          <UIText kind="small/regular" color="var(--neutral-500)">
            Or create a new wallet group
          </UIText>
          <SurfaceList
            items={[
              {
                key: 0,
                to: createNextHref('/get-started/new', beforeCreate),
                component: (
                  <UIText kind="body/regular" color="var(--primary)">
                    <span
                      style={{ fontSize: '1.25em', verticalAlign: 'middle' }}
                    >
                      +
                    </span>{' '}
                    <span style={{ verticalAlign: 'middle' }}>
                      Create New Wallet Group
                    </span>
                  </UIText>
                ),
              },
            ]}
          />

          <UIText kind="small/regular" color="var(--neutral-500)">
            This will create a new recovery phrase
          </UIText>
        </VStack>
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
      <Route path="/readonly" element={<AddReadonlyAddress />} />
    </Routes>
  );
}

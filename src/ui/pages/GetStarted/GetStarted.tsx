import React, { useEffect, useMemo, useRef } from 'react';
import noop from 'lodash/noop';
import {
  Link,
  Route,
  Routes,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';
import EcosystemEthereumIcon from 'jsx:src/ui/assets/ecosystem-ethereum.svg';
import EcosystemSolanaIcon from 'jsx:src/ui/assets/ecosystem-solana.svg';
import DownloadIcon from 'jsx:src/ui/assets/download.svg';
import LedgerIcon from 'jsx:src/ui/assets/ledger-icon.svg';
import VisibleIcon from 'jsx:src/ui/assets/visible.svg';
import ZerionSquircle from 'jsx:src/ui/assets/zerion-squircle.svg';
import InfoIcon from 'jsx:src/ui/assets/info.svg';
import AddCircleIcon from 'jsx:src/ui/assets/add-circle-outlined.svg';
import { FEATURE_SOLANA } from 'src/env/config';
import type { WalletGroup } from 'src/shared/types/WalletGroup';
import { isMnemonicContainer } from 'src/shared/types/validators';
import { AddressBadge } from 'src/ui/components/AddressBadge';
import { AngleRightRow } from 'src/ui/components/AngleRightRow';
import { FillView } from 'src/ui/components/FillView';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { PageBottom } from 'src/ui/components/PageBottom';
import { PageColumn } from 'src/ui/components/PageColumn';
import { getGroupDisplayName } from 'src/ui/shared/getGroupDisplayName';
import { useWalletGroups } from 'src/ui/shared/requests/useWalletGroups';
import { Button } from 'src/ui/ui-kit/Button';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import {
  ItemLink as SurfaceItemLink,
  SurfaceList,
} from 'src/ui/ui-kit/SurfaceList/SurfaceList';
import * as surfaceListStyles from 'src/ui/ui-kit/SurfaceList/styles.module.css';
import {
  useBackgroundKind,
  whiteBackgroundKind,
} from 'src/ui/components/Background/Background';
import { openHref } from 'src/ui/shared/openUrl';
import { PageTop } from 'src/ui/components/PageTop';
import { AnimatedCheckmark } from 'src/ui/ui-kit/AnimatedCheckmark';
import { PageFullBleedColumn } from 'src/ui/components/PageFullBleedColumn';
import { useToggledValues } from 'src/ui/components/useToggledValues';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { BottomSheetDialog } from 'src/ui/ui-kit/ModalDialogs/BottomSheetDialog';
import { DialogTitle } from 'src/ui/ui-kit/ModalDialogs/DialogTitle';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { Media } from 'src/ui/ui-kit/Media';
import type { BlockchainType } from 'src/shared/wallet/classifiers';
import { ImportWallet } from './ImportWallet';
import { GenerateWallet } from './GenerateWallet';
import { AddReadonlyAddress } from './AddReadonlyAddress';

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

function SpaceZone({
  children,
  backgroundColor = 'var(--neutral-300)',
}: React.PropsWithChildren<{ backgroundColor?: string }>) {
  return (
    <div
      style={{
        borderRadius: 8,
        padding: 6,
        backgroundColor,
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
        Choose an option to set up your wallet
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
            <Media
              gap={12}
              vGap={0}
              alignItems="start"
              image={
                <SpaceZone backgroundColor="var(--positive-500)">
                  <DownloadIcon style={{ color: 'var(--always-white)' }} />
                </SpaceZone>
              }
              text={<UIText kind="body/accent">Import Wallet</UIText>}
              detailText={
                <UIText kind="small/regular" color="var(--neutral-500)">
                  Add an existing wallet using a recovery phrase or private key.
                </UIText>
              }
            ></Media>
          </AngleRightRow>
        </TemporaryListItem>
        <TemporaryListItem
          to={importLedgerHref}
          onClick={(event) => openHref(event, { windowType: 'tab' })}
        >
          <AngleRightRow>
            <Media
              gap={12}
              vGap={0}
              alignItems="start"
              image={
                <SpaceZone backgroundColor="var(--black)">
                  <LedgerIcon style={{ color: 'var(--white)' }} />
                </SpaceZone>
              }
              text={<UIText kind="body/accent">Connect Ledger</UIText>}
              detailText={
                <UIText kind="small/regular" color="var(--neutral-500)">
                  Use your hardware wallet with Zerion.
                </UIText>
              }
            ></Media>
          </AngleRightRow>
        </TemporaryListItem>
        <TemporaryListItem to={addReadonlyHref}>
          <AngleRightRow>
            <Media
              gap={12}
              vGap={0}
              alignItems="start"
              image={
                <SpaceZone backgroundColor="#29BFEF">
                  <VisibleIcon style={{ color: '#D4F2FC' }} />
                </SpaceZone>
              }
              text={<UIText kind="body/accent">Watch Address</UIText>}
              detailText={
                <UIText kind="small/regular" color="var(--neutral-500)">
                  Follow any wallets to track their onchain activities.
                </UIText>
              }
            ></Media>
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
  const dialogRef = useRef<HTMLDialogElementInterface>(null);
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
        <UnstyledButton onClick={() => dialogRef.current?.showModal()}>
          <span
            title="Each group contains wallets that are associated with same recovery phrase, stored locally on your device. Zerion does not have access to this data.

  We do not cross-associate wallet addresses or have a way to know that these wallets are grouped."
          ></span>
          <InfoIcon
            role="presentation"
            style={{
              width: 28,
              height: 28,
              verticalAlign: 'bottom',
              color: 'var(--neutral-500)',
            }}
          />
        </UnstyledButton>
        <BottomSheetDialog ref={dialogRef} height="min-content">
          <DialogTitle
            alignTitle="start"
            title={
              <UIText kind="headline/h3">
                Wallets Are Grouped by Recovery Phrase
              </UIText>
            }
          />
          <Spacer height={24} />
          <UIText kind="body/regular" style={{ textAlign: 'start' }}>
            Each group contains wallets that are associated with same recovery
            phrase.
            <br />
            <br />
            Your recovery phrase is stored locally on your device. Zerion does
            not have access to this data.
            <br />
            <br />
            We do not cross-associate wallet addresses or have a way to know
            that these wallets are grouped.
          </UIText>
          <Spacer height={32} />
          <form method="dialog">
            <Button style={{ width: '100%' }}>Close</Button>
          </form>
        </BottomSheetDialog>
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
            <SpaceZone backgroundColor="var(--actions-default)">
              <AddCircleIcon style={{ color: 'var(--always-white)' }} />
            </SpaceZone>
            <UIText kind="body/accent">Create New Backup</UIText>
          </HStack>
        </TemporaryListItem>
      </VStack>
      <PageBottom />
    </PageColumn>
  );
}

export function EcosystemOptionsList({
  values,
  onValueToggle,
}: {
  values: Set<BlockchainType>;
  onValueToggle: (value: BlockchainType) => void;
}) {
  const solanaEnabled = FEATURE_SOLANA === 'on';
  return (
    <SurfaceList
      gap={4}
      style={{ backgroundColor: 'var(--z-index-0)' }}
      items={[
        {
          key: 'ethereum',
          pad: false,
          onClick: solanaEnabled ? () => onValueToggle('evm') : undefined,
          component: (
            <HStack gap={12} justifyContent="space-between" alignItems="center">
              <HStack gap={12} alignItems="center">
                <EcosystemEthereumIcon style={{ width: 44, height: 44 }} />
                <VStack gap={0}>
                  <UIText kind="body/accent">Ethereum Ecosystem</UIText>

                  <HStack gap={4} alignItems="center">
                    <img
                      style={{
                        width: 76,
                        height: 20,
                        position: 'relative',
                        top: 1,
                        left: -2,
                      }}
                      alt="Evm Chains"
                      src="https://cdn.zerion.io/images/dna-assets/evm-chains.png"
                      srcSet="https://cdn.zerion.io/images/dna-assets/evm-chains.png, https://cdn.zerion.io/images/dna-assets/evm-chains_2x.png 2x"
                    />
                    <UIText kind="small/regular" color="var(--neutral-600)">
                      +60 more
                    </UIText>
                  </HStack>
                </VStack>
              </HStack>
              <span>
                <AnimatedCheckmark
                  checked={values.has('evm')}
                  checkedColor="var(--primary)"
                />
              </span>
            </HStack>
          ),
        },
        {
          key: 'divider',
          pad: false,
          style: solanaEnabled ? undefined : { display: 'none' },
          component: (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto 1fr',
                gap: 12,
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  height: 1,
                  borderBottom: '1px dashed var(--neutral-300)',
                  width: '100%',
                }}
              ></div>
              <UIText kind="body/regular">And</UIText>
              <div
                style={{
                  height: 1,
                  borderBottom: '1px dashed var(--neutral-300)',
                  width: '100%',
                }}
              ></div>
            </div>
          ),
        },
        {
          key: 'solana',
          pad: false,
          style: solanaEnabled ? undefined : { display: 'none' },
          onClick: () => onValueToggle('solana'),
          component: (
            <HStack gap={12} justifyContent="space-between" alignItems="center">
              <HStack gap={12} alignItems="center">
                <EcosystemSolanaIcon style={{ width: 44, height: 44 }} />
                <UIText kind="body/accent">Solana Ecosystem</UIText>
              </HStack>
              <span>
                <AnimatedCheckmark
                  checked={values.has('solana')}
                  checkedColor="var(--primary)"
                />
              </span>
            </HStack>
          ),
        },
      ]}
    />
  );
}

function NewWalletGroup() {
  const title = 'Create New Wallet';
  useBackgroundKind(whiteBackgroundKind);
  const [values, toggleValueOriginal] = useToggledValues(
    () =>
      new Set<BlockchainType>(
        FEATURE_SOLANA === 'on' ? ['evm', 'solana'] : ['evm']
      )
  );
  const toggleValue = FEATURE_SOLANA === 'on' ? toggleValueOriginal : noop;
  const navigate = useNavigate();
  return (
    <PageColumn>
      <NavigationTitle title={null} documentTitle={title} />
      <PageTop />

      <VStack gap={4} style={{ textAlign: 'center' }}>
        <UIText kind="headline/h3">{title}</UIText>
        <UIText kind="small/accent" color="var(--neutral-600)">
          You can update this selection later
          <br />
          in Manage Wallets
        </UIText>
      </VStack>

      <Spacer height={24} />
      <PageFullBleedColumn paddingInline={false}>
        <EcosystemOptionsList values={values} onValueToggle={toggleValue} />
      </PageFullBleedColumn>
      <Button
        style={{ marginTop: 'auto' }}
        disabled={values.size === 0}
        onClick={() => {
          const params = new URLSearchParams(
            Array.from(values).map((value) => ['ecosystems', value])
          );
          navigate(`/get-started/new/generate?${params}`);
        }}
      >
        Continue{values.size ? ` (${values.size})` : null}
      </Button>
      <PageBottom />
    </PageColumn>
  );
}

export function GetStarted() {
  return (
    <Routes>
      <Route path="/" element={<Options />} />
      <Route path="/new" element={<NewWalletGroup />} />
      <Route path="/new/generate" element={<GenerateWallet />} />
      <Route path="/import/*" element={<ImportWallet />} />
      <Route path="/wallet-group-select" element={<WalletGroupSelect />} />
      <Route path="/existing-select" element={<ExistingWalletOptions />} />
      <Route path="/readonly" element={<AddReadonlyAddress />} />
    </Routes>
  );
}

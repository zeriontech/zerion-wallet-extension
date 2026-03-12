import React, { useCallback, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { PageColumn } from 'src/ui/components/PageColumn';
import { walletPort, windowPort } from 'src/ui/shared/channels';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Button } from 'src/ui/ui-kit/Button';
import { CenteredDialog } from 'src/ui/ui-kit/ModalDialogs/CenteredDialog';
import { FillView } from 'src/ui/components/FillView';
import ArrowDownIcon from 'jsx:src/ui/assets/caret-down-filled.svg';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import { DialogTitle } from 'src/ui/ui-kit/ModalDialogs/DialogTitle';
import { SiteFaviconImg } from 'src/ui/components/SiteFaviconImg';
import { invariant } from 'src/shared/invariant';
import { WalletAvatar } from 'src/ui/components/WalletAvatar';
import { PageTop } from 'src/ui/components/PageTop';
import { WalletDisplayName } from 'src/ui/components/WalletDisplayName';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import type { ExternallyOwnedAccount } from 'src/shared/types/ExternallyOwnedAccount';
import type { WalletGroup } from 'src/shared/types/WalletGroup';
import type { BareWallet } from 'src/shared/types/BareWallet';
import type { DeviceAccount } from 'src/shared/types/Device';
import {
  assertKnownEcosystems,
  isMatchForEcosystem,
} from 'src/shared/wallet/shared';
import type { BlockchainType } from 'src/shared/wallet/classifiers';
import { EmptyView2 } from 'src/ui/components/EmptyView';
import { useBackgroundKind } from 'src/ui/components/Background';
import { whiteBackgroundKind } from 'src/ui/components/Background/Background';
import { usePreferences } from 'src/ui/features/preferences';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { WalletList } from '../WalletSelect/WalletList';

const ECOSYSTEM_ICONS: Record<BlockchainType, { src: string; srcSet: string }> =
  {
    evm: {
      src: 'https://cdn.zerion.io/images/dna-assets/ethereum-connection.png',
      srcSet:
        'https://cdn.zerion.io/images/dna-assets/ethereum-connection.png, https://cdn.zerion.io/images/dna-assets/ethereum-connection_2x.png 2x',
    },
    solana: {
      src: 'https://cdn.zerion.io/images/dna-assets/solana-connection.png',
      srcSet:
        'https://cdn.zerion.io/images/dna-assets/solana-connection.png, https://cdn.zerion.io/images/dna-assets/solana-connection_2x.png 2x',
    },
  };

const ECOSYSTEM_NAMES: Record<BlockchainType, string> = {
  evm: 'Ethereum',
  solana: 'Solana',
};

function WalletSelectDialog({
  value,
  ecosystem,
  walletGroups,
  connectedAddresses,
  onSelect,
}: {
  value: string;
  ecosystem: BlockchainType;
  walletGroups?: WalletGroup[] | null;
  connectedAddresses: Set<string>;
  onSelect(wallet: ExternallyOwnedAccount | BareWallet | DeviceAccount): void;
}) {
  const { preferences } = usePreferences();

  return walletGroups?.length ? (
    <VStack gap={24} style={{ paddingTop: 72 }}>
      <VStack gap={12} style={{ justifyItems: 'center' }}>
        <img
          alt="Ecosystem Icon"
          style={{ width: 80, height: 64 }}
          {...ECOSYSTEM_ICONS[ecosystem]}
        />
        <UIText kind="body/accent">
          Select a connected {ECOSYSTEM_NAMES[ecosystem]} wallet
        </UIText>
      </VStack>
      <WalletList
        walletsOrder={preferences?.walletsOrder}
        selectedAddress={value}
        walletGroups={walletGroups}
        onSelect={onSelect}
        showAddressValues={true}
        predicate={(item) =>
          isMatchForEcosystem(item.address, ecosystem) &&
          connectedAddresses.has(normalizeAddress(item.address))
        }
      />
    </VStack>
  ) : (
    <FillView>
      <UIText kind="headline/h2" color="var(--neutral-500)">
        No Wallets
      </UIText>
    </FillView>
  );
}

function SelectConnectedWalletView({
  origin,
  ecosystem,
  wallet,
  currentWallet,
  walletGroups,
  connectedAddresses,
  onConfirm,
  onReject,
}: {
  origin: string;
  ecosystem: BlockchainType;
  wallet: ExternallyOwnedAccount;
  currentWallet: ExternallyOwnedAccount | null;
  walletGroups?: WalletGroup[] | null;
  connectedAddresses: Set<string>;
  onConfirm: (value: { address: string }) => void;
  onReject: () => void;
}) {
  useBackgroundKind(whiteBackgroundKind);
  const walletSelectDialogRef = useRef<HTMLDialogElementInterface | null>(null);
  const [selectedWallet, setSelectedWallet] = useState(wallet);
  const originName = new URL(origin).hostname;

  return (
    <>
      <NavigationTitle title={null} documentTitle="Switch Wallet" />
      <CenteredDialog
        ref={walletSelectDialogRef}
        containerStyle={{
          ['--surface-background-color' as string]: 'transparent',
        }}
      >
        <DialogTitle title={null} closeKind="icon" />
        <WalletSelectDialog
          value={normalizeAddress(selectedWallet.address)}
          walletGroups={walletGroups}
          ecosystem={ecosystem}
          connectedAddresses={connectedAddresses}
          onSelect={(wallet) => {
            walletSelectDialogRef.current?.close();
            setSelectedWallet(wallet);
          }}
        />
      </CenteredDialog>
      <PageTop />
      <PageColumn>
        <VStack gap={8}>
          <VStack
            gap={8}
            style={{
              justifyItems: 'center',
              padding: 24,
              border: '1px solid var(--neutral-200)',
              backgroundColor: 'var(--light-background-transparent)',
              backdropFilter: 'blur(16px)',
              borderRadius: 12,
            }}
          >
            <SiteFaviconImg
              size={64}
              style={{ borderRadius: 16 }}
              url={origin}
              alt={`Logo for ${origin}`}
            />
            <UIText
              kind="headline/h2"
              style={{ maxWidth: '100%', overflowWrap: 'anywhere' }}
            >
              {originName}
            </UIText>
          </VStack>
          <VStack
            gap={4}
            style={{
              justifyItems: 'center',
              padding: 12,
              backgroundColor: 'var(--notice-100)',
              borderRadius: 12,
            }}
          >
            <UIText
              kind="small/accent"
              color="var(--neutral-600)"
              style={{ textAlign: 'center' }}
            >
              This signature requires{' '}
              {ecosystem === 'evm' ? 'an Ethereum' : 'a Solana'} wallet.
              <br />
              Please select one of your connected wallets.
            </UIText>
          </VStack>
          <VStack gap={24}>
            {currentWallet ? (
              <VStack gap={0} style={{ justifyItems: 'center' }}>
                <UIText kind="small/accent" color="var(--neutral-500)">
                  Active Wallet
                </UIText>
                <HStack
                  gap={12}
                  alignItems="center"
                  justifyContent="center"
                  style={{
                    padding: '8px 12px',
                  }}
                >
                  <WalletAvatar
                    address={currentWallet.address}
                    size={24}
                    borderRadius={8}
                  />
                  <UIText kind="small/accent" color="var(--black)">
                    <WalletDisplayName wallet={currentWallet} />
                  </UIText>
                </HStack>
              </VStack>
            ) : null}
            <VStack gap={8} style={{ justifyItems: 'center' }}>
              <UIText kind="small/accent" color="var(--neutral-500)">
                Switch to {ECOSYSTEM_NAMES[ecosystem]} wallet
              </UIText>
              <UnstyledButton
                onClick={() => walletSelectDialogRef.current?.showModal()}
                className="parent-hover"
                style={{
                  width: '100%',
                  padding: 12,
                  backgroundColor: 'var(--neutral-100)',
                  borderRadius: 12,
                  border: '1px solid var(--primary-200)',
                  ['--parent-content-color' as string]: 'var(--neutral-500)',
                  ['--parent-hovered-content-color' as string]: 'var(--black)',
                }}
              >
                <HStack
                  gap={16}
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <HStack gap={12} alignItems="center">
                    <WalletAvatar
                      address={selectedWallet.address}
                      size={44}
                      borderRadius={12}
                    />
                    <VStack gap={0} style={{ justifyItems: 'start' }}>
                      <UIText kind="small/accent" color="var(--neutral-500)">
                        Wallet
                      </UIText>
                      <UIText kind="body/accent">
                        <WalletDisplayName wallet={selectedWallet} />
                      </UIText>
                    </VStack>
                  </HStack>
                  <ArrowDownIcon
                    className="content-hover"
                    style={{ width: 24, height: 24 }}
                  />
                </HStack>
              </UnstyledButton>
            </VStack>
          </VStack>
        </VStack>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
            marginTop: 'auto',
            paddingBottom: 32,
          }}
        >
          <Button type="button" kind="regular" onClick={onReject}>
            Cancel
          </Button>
          <Button
            style={{ paddingInline: 0 }}
            onClick={() => onConfirm({ address: selectedWallet.address })}
          >
            Switch & Continue
          </Button>
        </div>
      </PageColumn>
    </>
  );
}

class NoConnectedWalletForEcosystemError extends Error {}

export function SelectConnectedWallet() {
  const [params] = useSearchParams();
  const origin = params.get('origin');
  const windowId = params.get('windowId');
  const ecosystem = (params.get('ecosystem') || 'evm') as BlockchainType;
  assertKnownEcosystems([ecosystem]);

  invariant(origin, 'origin get-parameter is required');
  invariant(windowId, 'windowId get-parameter is required');

  const { data, isLoading, isError, error } = useQuery({
    retry: 1,
    // some bug in linter, probably
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: ['prepareSelectConnectedWalletData', ecosystem, origin],
    useErrorBoundary: false,
    queryFn: async () => {
      const [permissions, allWalletGroups, currentWallet] = await Promise.all([
        walletPort.request('getOriginPermissions'),
        walletPort.request('uiGetWalletGroups'),
        walletPort.request('uiGetCurrentWallet'),
      ]);

      const connectedAddresses = new Set(
        (permissions[origin]?.addresses ?? []).map(normalizeAddress)
      );

      const predicate = (wallet: { address: string }) =>
        isMatchForEcosystem(wallet.address, ecosystem) &&
        connectedAddresses.has(normalizeAddress(wallet.address));

      const walletGroups = allWalletGroups?.filter((group) =>
        group.walletContainer.wallets.some(predicate)
      );

      const wallet =
        walletGroups?.at(0)?.walletContainer.wallets.find(predicate) ?? null;

      if (!wallet) {
        throw new NoConnectedWalletForEcosystemError(ecosystem);
      }

      return {
        wallet,
        walletGroups,
        connectedAddresses,
        currentWallet: currentWallet ?? null,
      };
    },
  });

  const handleConfirm = useCallback(
    (result: { address: string }) => {
      windowPort.confirm(windowId, result);
    },
    [windowId]
  );
  const handleReject = () => windowPort.reject(windowId);

  if (isError) {
    if (error instanceof NoConnectedWalletForEcosystemError) {
      const ecosystemName = ECOSYSTEM_NAMES[ecosystem];
      return (
        <EmptyView2
          title={`No ${ecosystemName} wallets connected`}
          message={`You have no ${ecosystemName} wallets connected to this site. Please close this window and connect a ${ecosystemName} wallet first.`}
        />
      );
    } else {
      throw error;
    }
  }

  if (isLoading || !data?.wallet) {
    return null;
  }

  return (
    <SelectConnectedWalletView
      wallet={data.wallet}
      currentWallet={data.currentWallet}
      walletGroups={data.walletGroups}
      connectedAddresses={data.connectedAddresses}
      origin={origin}
      ecosystem={ecosystem}
      onConfirm={handleConfirm}
      onReject={handleReject}
    />
  );
}

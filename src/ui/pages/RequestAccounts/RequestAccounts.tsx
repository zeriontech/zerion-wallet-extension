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
import {
  DialogButtonValue,
  DialogTitle,
} from 'src/ui/ui-kit/ModalDialogs/DialogTitle';
import { SiteFaviconImg } from 'src/ui/components/SiteFaviconImg';
import { invariant } from 'src/shared/invariant';
import { focusNode } from 'src/ui/shared/focusNode';
import { WalletAvatar } from 'src/ui/components/WalletAvatar';
import { PageTop } from 'src/ui/components/PageTop';
import { WalletDisplayName } from 'src/ui/components/WalletDisplayName';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import type { ExternallyOwnedAccount } from 'src/shared/types/ExternallyOwnedAccount';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
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
import InfoIcon from 'jsx:src/ui/assets/info.svg';
import { BottomSheetDialog } from 'src/ui/ui-kit/ModalDialogs/BottomSheetDialog';
import { usePhishingDefenceStatus } from 'src/ui/components/PhishingDefence/usePhishingDefenceStatus';
import {
  SecurityStatusBackground,
  DappSecurityCheck,
} from 'src/ui/shared/security-check';
import { useEvent } from 'src/ui/shared/useEvent';
import type { Permission } from 'src/shared/types/Permission';
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

function WalletSelectDialog({
  value,
  ecosystem,
  walletGroups,
  onSelect,
}: {
  value: string;
  ecosystem: BlockchainType;
  walletGroups?: WalletGroup[] | null;
  onSelect(wallet: ExternallyOwnedAccount | BareWallet | DeviceAccount): void;
}) {
  return walletGroups?.length ? (
    <VStack gap={24} style={{ paddingTop: 72 }}>
      <VStack gap={12} style={{ justifyItems: 'center' }}>
        <img
          alt="Ecosystem Icon"
          style={{ width: 80, height: 64 }}
          {...ECOSYSTEM_ICONS[ecosystem]}
        />
        <UIText kind="body/accent">
          Dapp requests connection
          <br />
          to the {ecosystem === 'evm' ? 'Ethereum' : 'Solana'} ecosystem.
        </UIText>
      </VStack>
      <WalletList
        selectedAddress={value}
        walletGroups={walletGroups}
        onSelect={onSelect}
        showAddressValues={true}
        predicate={(item) => isMatchForEcosystem(item.address, ecosystem)}
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

function useRedirectIfOriginAlreadyAllowed({
  origin,
  address,
  onIsAllowed,
}: {
  origin: string;
  address: string | undefined;
  onIsAllowed: () => void;
}) {
  const onSuccess = useEvent((result: Record<string, Permission>) => {
    if (!address) {
      return;
    }
    const normalizedAddress = normalizeAddress(address);
    const isAllowed = result[origin]?.addresses.includes(normalizedAddress);
    if (isAllowed) {
      onIsAllowed();
    }
  });
  useQuery({
    queryKey: ['getOriginPermissions'],
    queryFn: async () => {
      const result = await walletPort.request('getOriginPermissions');
      onSuccess(result);
      return result;
    },
    enabled: Boolean(address),
    useErrorBoundary: true,
    suspense: true,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

function RequestAccountsView({
  origin,
  ecosystem,
  wallet,
  walletGroups,
  onConfirm,
  onReject,
}: {
  origin: string;
  ecosystem: BlockchainType;
  wallet: ExternallyOwnedAccount;
  walletGroups?: WalletGroup[] | null;
  onConfirm: (value: { address: string; origin: string }) => void;
  onReject: () => void;
}) {
  useBackgroundKind(whiteBackgroundKind);
  const walletSelectDialogRef = useRef<HTMLDialogElementInterface | null>(null);
  const connectionDescriptionDialogRef =
    useRef<HTMLDialogElementInterface | null>(null);
  const [selectedWallet, setSelectedWallet] = useState(wallet);
  const originName = new URL(origin).hostname;
  const securityQuery = usePhishingDefenceStatus(origin);

  return (
    <>
      <SecurityStatusBackground />
      <NavigationTitle title={null} documentTitle="Connect Wallet" />
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
          onSelect={(wallet) => {
            walletSelectDialogRef.current?.close();
            setSelectedWallet(wallet);
          }}
        />
      </CenteredDialog>
      <BottomSheetDialog
        ref={connectionDescriptionDialogRef}
        height="fit-content"
      >
        <VStack gap={32}>
          <VStack gap={16}>
            <img
              style={{ width: 120, height: 120, justifySelf: 'center' }}
              alt="Site Connection"
              src="https://cdn.zerion.io/images/dna-assets/site-connection.png"
              srcSet="https://cdn.zerion.io/images/dna-assets/site-connection.png, https://cdn.zerion.io/images/dna-assets/site-connection_2x.png 2x"
            />
            <UIText kind="headline/h3">Approve Site Connection</UIText>
            <UIText kind="body/regular">
              This site will have read-only access to your balances and
              transaction activity. It cannot access your funds or execute
              transactions without your approval.
            </UIText>
          </VStack>
          <form method="dialog" onSubmit={(event) => event.stopPropagation()}>
            <Button
              value={DialogButtonValue.cancel}
              kind="primary"
              style={{ width: '100%' }}
            >
              Close
            </Button>
          </form>
        </VStack>
      </BottomSheetDialog>
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
            <UnstyledButton
              onClick={() =>
                connectionDescriptionDialogRef.current?.showModal()
              }
            >
              <HStack gap={4} alignItems="center">
                <UIText kind="body/regular" color="var(--neutral-600)">
                  Wants to connect to your wallet
                </UIText>
                <InfoIcon
                  style={{ width: 20, height: 20, color: 'var(--neutral-600)' }}
                />
              </HStack>
            </UnstyledButton>
          </VStack>
          <UnstyledButton
            onClick={() => walletSelectDialogRef.current?.showModal()}
            className="parent-hover"
            style={{
              padding: 12,
              backgroundColor: 'var(--neutral-100)',
              borderRadius: 12,
              ['--parent-content-color' as string]: 'var(--neutral-500)',
              ['--parent-hovered-content-color' as string]: 'var(--black)',
            }}
          >
            <HStack gap={16} justifyContent="space-between" alignItems="center">
              <HStack gap={12} alignItems="center">
                <WalletAvatar
                  address={selectedWallet.address}
                  size={44}
                  borderRadius={12}
                />
                <VStack gap={0} style={{ justifyItems: 'start' }}>
                  <UIText kind="body/regular" color="var(--neutral-600)">
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
          <DappSecurityCheck
            status={securityQuery.data?.status}
            isLoading={securityQuery.isLoading}
          />
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
          <Button
            type="button"
            kind="regular"
            onClick={onReject}
            ref={focusNode}
          >
            Cancel
          </Button>
          <Button
            onClick={() =>
              onConfirm({ address: selectedWallet.address, origin })
            }
          >
            Connect
          </Button>
        </div>
      </PageColumn>
    </>
  );
}

class NoWalletForEcosystemError extends Error {}

export function RequestAccounts() {
  const [params] = useSearchParams();
  const origin = params.get('origin');
  const windowId = params.get('windowId');
  const ecosystem = (params.get('ecosystem') || 'evm') as BlockchainType;
  assertKnownEcosystems([ecosystem]);

  invariant(origin, 'origin get-parameter is required');
  invariant(windowId, 'windowId get-parameter is required');

  const { data, isLoading, isError, error } = useQuery({
    retry: 1,
    queryKey: ['prepareRequestAccountsViewData', ecosystem],
    useErrorBoundary: false,
    queryFn: async () => {
      const currentWallet = await walletPort.request('uiGetCurrentWallet');
      const allWalletGroups = await walletPort.request('uiGetWalletGroups');
      const walletGroups = allWalletGroups?.filter((group) => {
        return group.walletContainer.wallets.some((wallet) =>
          isMatchForEcosystem(wallet.address, ecosystem)
        );
      });

      const currentAddress = currentWallet?.address;

      let wallet: typeof currentWallet = null;
      if (currentAddress && isMatchForEcosystem(currentAddress, ecosystem)) {
        wallet = currentWallet;
      } else {
        wallet =
          walletGroups
            ?.at(0)
            ?.walletContainer.wallets.find((wallet) =>
              isMatchForEcosystem(wallet.address, ecosystem)
            ) ?? null;
      }
      if (!wallet) {
        throw new NoWalletForEcosystemError(ecosystem);
      }
      return { wallet, walletGroups };
    },
  });
  const wallet = data?.wallet;
  const walletGroups = data?.walletGroups;
  const handleConfirm = useCallback(
    (result: { address: string; origin: string }) => {
      windowPort.confirm(windowId, result);
    },
    [windowId]
  );
  const handleReject = () => windowPort.reject(windowId);

  useRedirectIfOriginAlreadyAllowed({
    origin,
    address: wallet?.address,
    onIsAllowed: () => {
      if (!wallet) {
        throw new Error('Wallet must be defined');
      }
      handleConfirm({ address: wallet.address, origin });
    },
  });

  if (isError) {
    if (error instanceof NoWalletForEcosystemError) {
      const messages: Record<BlockchainType, string> = {
        solana:
          'You do not have Solana wallets to connect. Please close this window and visit Settings –> Manage Wallets to create a Solana wallet',
        evm: 'You do not have Ethereum wallets to connect. Please close this window and visit Settings –> Manage Wallets to create an Ethereum wallet',
      };
      return (
        <EmptyView2
          title="No wallets to connect"
          message={messages[ecosystem]}
        />
      );
    } else {
      throw error;
    }
  }
  if (isLoading || !wallet) {
    return null;
  }
  return (
    <>
      <RequestAccountsView
        wallet={wallet}
        walletGroups={walletGroups}
        origin={origin}
        ecosystem={ecosystem}
        onConfirm={handleConfirm}
        onReject={handleReject}
      />
    </>
  );
}

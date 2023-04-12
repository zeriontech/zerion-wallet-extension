import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useQuery } from 'react-query';
import { useSearchParams } from 'react-router-dom';
import { PageColumn } from 'src/ui/components/PageColumn';
import { walletPort, windowPort } from 'src/ui/shared/channels';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Button } from 'src/ui/ui-kit/Button';
import { Background } from 'src/ui/components/Background';
import { Surface } from 'src/ui/ui-kit/Surface';
import { SurfaceList, SurfaceItemButton } from 'src/ui/ui-kit/SurfaceList';
import type { BareWallet } from 'src/shared/types/BareWallet';
import { CenteredDialog } from 'src/ui/ui-kit/ModalDialogs/CenteredDialog';
import { FillView } from 'src/ui/components/FillView';
import { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import { showConfirmDialog } from 'src/ui/ui-kit/ModalDialogs/showConfirmDialog';
import { DialogTitle } from 'src/ui/ui-kit/ModalDialogs/DialogTitle';
import { WalletMedia, Composition } from 'src/ui/components/WalletMedia';
import { SiteFaviconImg } from 'src/ui/components/SiteFaviconImg';
import { invariant } from 'src/shared/invariant';
import { focusNode } from 'src/ui/shared/focusNode';
import { KeyboardShortcut } from 'src/ui/components/KeyboardShortcut';
import { WalletAvatar } from 'src/ui/components/WalletAvatar';
import CheckmarkAllowedIcon from 'jsx:src/ui/assets/checkmark-allowed.svg';
import CheckmarkDeniedIcon from 'jsx:src/ui/assets/checkmark-denied.svg';
import ConnectIcon from 'jsx:src/ui/assets/connect.svg';
import { Badge } from 'src/ui/components/Badge';
import { PageTop } from 'src/ui/components/PageTop';
import { WalletDisplayName } from 'src/ui/components/WalletDisplayName';
import { Address } from 'src/ui/components/Address';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';

function WalletSelectList({
  wallets,
  value,
}: {
  wallets: BareWallet[];
  value: string;
}) {
  return (
    <form method="dialog">
      <SurfaceList
        items={wallets.map((wallet) => ({
          key: wallet.address,
          isInteractive: true,
          pad: false,
          component: (
            <SurfaceItemButton value={wallet.address}>
              <HStack
                gap={4}
                justifyContent="space-between"
                alignItems="center"
              >
                <WalletMedia
                  composition={Composition.nameAndPortfolio}
                  iconSize={24}
                  activeIndicator={true}
                  wallet={wallet}
                />
                {wallet.address.toLowerCase() === value ? (
                  <span style={{ color: 'var(--primary)' }}>✔</span>
                ) : null}
              </HStack>
            </SurfaceItemButton>
          ),
        }))}
      />
    </form>
  );
}

function WalletSelectDialog({
  value,
  wallets,
  dialogRef,
}: {
  value: string;
  wallets: BareWallet[];
  dialogRef: React.Ref<HTMLDialogElement>;
}) {
  return (
    <CenteredDialog ref={dialogRef}>
      <DialogTitle title={<UIText kind="body/accent">Select Wallet</UIText>} />
      {wallets.length ? (
        <WalletSelectList value={value} wallets={wallets} />
      ) : (
        <FillView>
          <UIText kind="headline/h2" color="var(--neutral-500)">
            No Wallets
          </UIText>
        </FillView>
      )}
    </CenteredDialog>
  );
}

function ChangeWalletButton(
  props: React.ButtonHTMLAttributes<HTMLButtonElement>
) {
  return (
    <UnstyledButton
      style={{
        padding: '6px 12px',
        borderRadius: 40,
        backgroundColor: 'var(--primary-200)',
        color: 'var(--primary-500)',
      }}
      {...props}
    >
      <UIText kind="caption/accent">Change</UIText>
    </UnstyledButton>
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
  useQuery(
    'getOriginPermissions',
    () => walletPort.request('getOriginPermissions'),
    {
      enabled: Boolean(address),
      useErrorBoundary: true,
      suspense: true,
      refetchOnWindowFocus: false,
      retry: false,
      onSuccess(result) {
        if (!address) {
          return;
        }
        const isAllowed = result[origin]?.addresses.includes(address);
        if (isAllowed) {
          onIsAllowed();
        }
      },
    }
  );
}

function RequestAccountsPermissions({ originName }: { originName: string }) {
  return (
    <Surface padding={16} style={{ border: '1px solid var(--neutral-300)' }}>
      <HStack gap={12}>
        <VStack gap={8}>
          <UIText kind="small/accent">Allow {originName} to:</UIText>
          <HStack gap={8} alignItems="center">
            <CheckmarkAllowedIcon />
            <UIText kind="small/regular">See your balance and activity</UIText>
          </HStack>
          <HStack gap={8} alignItems="center">
            <CheckmarkAllowedIcon />
            <UIText kind="small/regular">Send request for approvals</UIText>
          </HStack>
          <HStack gap={8} alignItems="center">
            <CheckmarkDeniedIcon />
            <UIText kind="small/regular">
              Sign transactions without your approval
            </UIText>
          </HStack>
        </VStack>
      </HStack>
    </Surface>
  );
}

function RequestAccountsView({
  origin,
  wallet,
  wallets,
  onConfirm,
  onReject,
}: {
  origin: string;
  wallet: BareWallet;
  wallets: BareWallet[];
  onConfirm: ({ address }: { address: string }) => void;
  onReject: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElementInterface | null>(null);
  const [selectedWallet, setSelectedWallet] = useState(wallet);
  const originName = new URL(origin).hostname;
  const walletsMap = useMemo(
    () => new Map(wallets.map((wallet) => [wallet.address, wallet])),
    [wallets]
  );
  const iconSize = 32;
  const iconBorderRadius = 6;
  return (
    <Background backgroundKind="white">
      <PageTop />
      <PageColumn
        style={{ ['--surface-background-color' as string]: 'var(--z-index-0)' }}
      >
        <Badge
          icon={<ConnectIcon style={{ color: 'var(--neutral-500)' }} />}
          text="Connect Wallet"
        />
        <Spacer height={16} />
        <VStack gap={8}>
          <UIText kind="small/accent" color="var(--neutral-500)">
            To application
          </UIText>
          <HStack gap={8} alignItems="center">
            <SiteFaviconImg
              style={{
                width: iconSize,
                height: iconSize,
                borderRadius: iconBorderRadius,
              }}
              url={origin}
              alt={`Logo for ${origin}`}
            />
            <UIText kind="headline/h2">{new URL(origin).hostname}</UIText>
          </HStack>
        </VStack>
        <Spacer height={16} />
        <VStack gap={8}>
          <UIText kind="small/accent" color="var(--neutral-500)">
            With wallet
          </UIText>
          <HStack gap={8} alignItems="center" justifyContent="space-between">
            <WalletSelectDialog
              value={normalizeAddress(selectedWallet.address)}
              wallets={wallets}
              dialogRef={dialogRef}
            />
            <HStack gap={8} alignItems="center">
              <WalletAvatar
                address={selectedWallet.address}
                size={iconSize}
                borderRadius={iconBorderRadius}
              />
              <UIText kind="headline/h2">
                <WalletDisplayName wallet={selectedWallet} />
              </UIText>
            </HStack>
            <ChangeWalletButton
              onClick={async () => {
                if (!dialogRef.current) {
                  return;
                }
                const result = await showConfirmDialog(dialogRef.current);
                const wallet = walletsMap.get(result);
                if (wallet) {
                  setSelectedWallet(wallet);
                }
              }}
            />
          </HStack>
          <Address
            address={normalizeAddress(selectedWallet.address)}
            infixColor="var(--neutral-500)"
          />
        </VStack>
        <Spacer height={16} />
        <RequestAccountsPermissions originName={originName} />
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
            ref={focusNode}
            onClick={() => onConfirm({ address: selectedWallet.address })}
          >
            Connect
          </Button>
        </div>
      </PageColumn>
    </Background>
  );
}

export function RequestAccounts() {
  const [params] = useSearchParams();
  const origin = params.get('origin');
  const windowId = params.get('windowId');

  invariant(origin, 'origin get-parameter is required');
  invariant(windowId, 'windowId get-parameter is required');

  const walletGroupsQuery = useQuery(
    'wallet/uiGetWalletGroups',
    () => walletPort.request('uiGetWalletGroups'),
    { useErrorBoundary: true }
  );
  const {
    data: wallet,
    isLoading,
    isError,
  } = useQuery('wallet/uiGetCurrentWallet', () => {
    return walletPort.request('uiGetCurrentWallet');
  });
  const handleConfirm = useCallback(
    (result: { address: string }) => {
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
      handleConfirm({ address: wallet.address });
    },
  });

  if (isError) {
    return <p>Some Error</p>;
  }
  if (isLoading || !wallet || walletGroupsQuery.isLoading) {
    return null;
  }
  return (
    <>
      <KeyboardShortcut combination="esc" onKeyDown={handleReject} />
      <RequestAccountsView
        wallet={wallet}
        wallets={
          walletGroupsQuery.data?.flatMap(
            (group) => group.walletContainer.wallets
          ) ?? []
        }
        origin={origin}
        onConfirm={handleConfirm}
        onReject={handleReject}
      />
    </>
  );
}

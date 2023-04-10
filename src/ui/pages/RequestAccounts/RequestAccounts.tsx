import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useQuery } from 'react-query';
import { useSearchParams } from 'react-router-dom';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { walletPort, windowPort } from 'src/ui/shared/channels';
import { Media } from 'src/ui/ui-kit/Media';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { UIText } from 'src/ui/ui-kit/UIText';
import { truncateAddress } from 'src/ui/shared/truncateAddress';
import { VStack } from 'src/ui/ui-kit/VStack';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Button } from 'src/ui/ui-kit/Button';
import { Background } from 'src/ui/components/Background';
import { Surface } from 'src/ui/ui-kit/Surface';
import ChevronRightIcon from 'jsx:src/ui/assets/chevron-right.svg';
import InfoIcon from 'jsx:src/ui/assets/info-icon-trimmed.svg';
import ZerionSquircle from 'jsx:src/ui/assets/zerion-squircle-2.svg';
import { TextAnchor } from 'src/ui/ui-kit/TextAnchor';
import { SurfaceList, SurfaceItemButton } from 'src/ui/ui-kit/SurfaceList';
import type { BareWallet } from 'src/shared/types/BareWallet';
import { CenteredDialog } from 'src/ui/ui-kit/ModalDialogs/CenteredDialog';
import { FillView } from 'src/ui/components/FillView';
import { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import { showConfirmDialog } from 'src/ui/ui-kit/ModalDialogs/showConfirmDialog';
import { DialogTitle } from 'src/ui/ui-kit/ModalDialogs/DialogTitle';
import { WalletMedia, Composition } from 'src/ui/components/WalletMedia';
import { invariant } from 'src/shared/invariant';
import { focusNode } from 'src/ui/shared/focusNode';
import { KeyboardShortcut } from 'src/ui/components/KeyboardShortcut';
import { WalletAvatar } from 'src/ui/components/WalletAvatar';

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

function GlowInfoIcon() {
  return (
    <div
      style={{
        boxShadow: `0 0 0px 3px var(--primary-300)`,
        color: 'var(--primary)',
        borderRadius: '50%',
        width: 'max-content',
      }}
    >
      <InfoIcon
        style={{
          display: 'block',
        }}
      />
    </div>
  );
}

function ChevronDownIcon() {
  return (
    <ChevronRightIcon
      style={{ display: 'block', transform: 'rotate(90deg)' }}
    />
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
        const normalizedAddress = normalizeAddress(address);
        const isAllowed = result[origin]?.addresses.includes(normalizedAddress);
        if (isAllowed) {
          onIsAllowed();
        }
      },
    }
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
  return (
    <Background backgroundKind="neutral">
      <PageColumn
        // different surface color on backgroundKind="neutral"
        style={{ ['--surface-background-color' as string]: 'var(--z-index-0)' }}
      >
        <PageTop />
        <PageTop />
        <VStack gap={8} style={{ placeItems: 'center' }}>
          <ZerionSquircle style={{ width: 40, height: 40 }} />
          <UIText kind="headline/h2">Connect to {originName}</UIText>
          <UIText kind="body/accent" color="var(--primary)">
            <TextAnchor href={origin} rel="noopener noreferrer" target="_blank">
              {originName}
            </TextAnchor>
          </UIText>
        </VStack>
        <Spacer height={24} />
        <SurfaceList
          items={[
            {
              key: 0,
              isInteractive: true,
              pad: false,
              component: (
                <>
                  <WalletSelectDialog
                    value={normalizeAddress(selectedWallet.address)}
                    wallets={wallets}
                    dialogRef={dialogRef}
                  />
                  <SurfaceItemButton
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
                  >
                    <HStack
                      gap={8}
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Media
                        image={
                          <WalletAvatar
                            address={selectedWallet.address}
                            size={36}
                            borderRadius={4}
                          />
                        }
                        text={
                          <UIText
                            kind="caption/regular"
                            color="var(--neutral-500)"
                          >
                            Wallet
                          </UIText>
                        }
                        detailText={
                          <UIText kind="small/accent">
                            {truncateAddress(selectedWallet.address, 4)}
                          </UIText>
                        }
                      />
                      <ChevronDownIcon />
                    </HStack>
                  </SurfaceItemButton>
                </>
              ),
            },
          ]}
        ></SurfaceList>
        <Spacer height={16} />
        <Surface padding={12} style={{ backgroundColor: 'var(--primary-200)' }}>
          <HStack gap={12}>
            <div>
              <GlowInfoIcon />
            </div>
            <VStack gap={4}>
              <UIText kind="small/accent" color="var(--primary)">
                By connecting, you allow to:
              </UIText>
              <UIText kind="small/regular">
                <ul
                  style={{
                    margin: 0,
                    paddingInlineStart: 16,
                    color: 'var(--neutral-700)',
                  }}
                >
                  <li>See your balance and activity</li>
                  <li>Request approval for transactions</li>
                </ul>
              </UIText>
            </VStack>
          </HStack>
        </Surface>

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
            Reject
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

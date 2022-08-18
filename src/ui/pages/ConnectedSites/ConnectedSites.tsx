import React, { useMemo, useRef } from 'react';
import { useMutation, useQuery } from 'react-query';
import type { WalletGroup } from 'src/shared/types/WalletGroup';
import type { BareWallet } from 'src/shared/types/BareWallet';
import { PageBottom } from 'src/ui/components/PageBottom';
import { PageColumn } from 'src/ui/components/PageColumn';
import { walletPort } from 'src/ui/shared/channels';
import { HStack } from 'src/ui/ui-kit/HStack';
import { SurfaceList } from 'src/ui/ui-kit/SurfaceList';
import { UIText } from 'src/ui/ui-kit/UIText';
import ChevronRightIcon from 'src/ui/assets/chevron-right.svg';
import GlobeIcon from 'src/ui/assets/globe.svg';
import { FillView } from 'src/ui/components/FillView';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { AddressBadge } from 'src/ui/components/AddressBadge';
import { Media } from 'src/ui/ui-kit/Media';
import { Image } from 'src/ui/ui-kit/MediaFallback';
import { VStack } from 'src/ui/ui-kit/VStack';
import { Button } from 'src/ui/ui-kit/Button';
import { BottomSheetDialog } from 'src/ui/ui-kit/ModalDialogs/BottomSheetDialog';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { showConfirmDialog } from 'src/ui/ui-kit/ModalDialogs/showConfirmDialog';

function RevokeAllConfirmation() {
  return (
    <form
      method="dialog"
      style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
    >
      <VStack gap={8}>
        <UIText kind="subtitle/l_med">Are you sure?</UIText>
        <UIText kind="body/s_reg">
          The websites will no longer see your addresses, but they can request
          access again
        </UIText>
      </VStack>
      <HStack gap={12} style={{ marginTop: 'auto' }}>
        <Button value="cancel" kind="regular">
          Cancel
        </Button>
        <Button value="confirm">Yes</Button>
      </HStack>
    </form>
  );
}

function RevokeAllPermissionsComponent({
  onRevokeAll,
}: {
  onRevokeAll: () => void;
}) {
  const removeAllOriginsMutation = useMutation(
    () => walletPort.request('removeAllOrigins'),
    { useErrorBoundary: true, onSuccess: onRevokeAll }
  );
  const dialogRef = useRef<HTMLDialogElementInterface | null>(null);
  return (
    <>
      <BottomSheetDialog ref={dialogRef}>
        <RevokeAllConfirmation />
      </BottomSheetDialog>
      <SurfaceList
        items={[
          {
            key: 0,
            onClick: () => {
              if (dialogRef.current) {
                showConfirmDialog(dialogRef.current).then(() => {
                  removeAllOriginsMutation.mutate();
                });
              }
            },
            component: (
              <UIText kind="body/s_reg" color="var(--negative-500)">
                {removeAllOriginsMutation.isLoading
                  ? 'Loading...'
                  : 'Revoke All'}
              </UIText>
            ),
          },
        ]}
      />
    </>
  );
}

interface ConnectedSiteItem {
  origin: string;
  addresses: string[];
  wallets: BareWallet[];
}

function ConnectedSitesList({
  items,
  onRevokeAll,
}: {
  items: ConnectedSiteItem[];
  onRevokeAll: () => void;
}) {
  const iconStyle = { width: 16, height: 16 };
  return (
    <VStack gap={24}>
      <SurfaceList
        items={items.map((item) => {
          const alt = `Logo for ${item.origin}`;
          return {
            key: item.origin,
            // to: `/connected-sites/${item.origin}`,
            to: '/not-implemented',
            component: (
              <HStack
                gap={4}
                justifyContent="space-between"
                alignItems="center"
              >
                <Media
                  image={
                    <div>
                      <Image
                        style={iconStyle}
                        src={`${item.origin}/favicon.ico`}
                        alt={alt}
                        renderError={() => (
                          <Image
                            style={iconStyle}
                            src={`${item.origin}/favicon.png`}
                            alt={alt}
                            renderError={() => <GlobeIcon style={iconStyle} />}
                          />
                        )}
                      />
                    </div>
                  }
                  text={<UIText kind="body/s_reg">{item.origin}</UIText>}
                  detailText={
                    <div
                      style={{
                        display: 'flex',
                        gap: 8,
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {item.wallets.slice(0, 3).map((wallet, index) => (
                        <AddressBadge
                          key={wallet.address}
                          wallet={wallet}
                          style={{
                            padding: 0,
                            backgroundColor: 'transparent',
                            minWidth: index > 1 ? 0 : undefined,
                          }}
                        />
                      ))}
                    </div>
                  }
                />

                <ChevronRightIcon />
              </HStack>
            ),
          };
        })}
      />
      <RevokeAllPermissionsComponent onRevokeAll={onRevokeAll} />
    </VStack>
  );
}

interface PermissionRecord {
  origin: string;
  addresses: string[];
}

function createBareWallet(address: string): BareWallet {
  return {
    address,
    mnemonic: null,
    privateKey: '<privateKey>',
    name: null,
  };
}

function updatePermissionsWithWallets(
  permissions: PermissionRecord[],
  walletGroups: WalletGroup[]
): ConnectedSiteItem[] {
  const walletsMap = new Map(
    walletGroups
      .flatMap((group) => group.walletContainer.wallets)
      .map((wallet) => [wallet.address, wallet])
  );
  return permissions.map((permission) => ({
    ...permission,
    wallets: permission.addresses.map((address) => {
      const wallet = walletsMap.get(address);
      return wallet || createBareWallet(address);
    }),
  }));
}

export function ConnectedSites() {
  const { data: originPermissions, ...connectedSitesQuery } = useQuery(
    'wallet/getOriginPermissions',
    () => walletPort.request('getOriginPermissions'),
    { useErrorBoundary: true }
  );
  const { data: walletGroups, ...walletGroupsQuery } = useQuery(
    'wallet/uiGetWalletGroups',
    () => walletPort.request('uiGetWalletGroups'),
    { useErrorBoundary: true }
  );
  const connectedSites = useMemo(() => {
    if (!originPermissions || !walletGroups) {
      return null;
    }
    return updatePermissionsWithWallets(originPermissions, walletGroups);
  }, [originPermissions, walletGroups]);

  if (connectedSitesQuery.isLoading || walletGroupsQuery.isLoading) {
    return <p>Loading...</p>;
  }

  return (
    <PageColumn>
      {connectedSites?.length ? (
        <>
          <Spacer height={16} />
          <ConnectedSitesList
            items={connectedSites}
            onRevokeAll={() => connectedSitesQuery.refetch()}
          />
        </>
      ) : (
        <FillView>
          <UIText
            kind="subtitle/l_reg"
            color="var(--neutral-500)"
            style={{ padding: 20, textAlign: 'center' }}
          >
            You will see a list of connected DApps here
          </UIText>
        </FillView>
      )}
      <PageBottom />
    </PageColumn>
  );
}
